import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { BookOpen, ExternalLink, FileText, FolderOpen, Layers, Video } from "lucide-react";
import {
  deleteAdminLessonAction,
  deleteResourceAction,
  prepareAdminVideoUploadAction,
  saveAdminLessonAction,
} from "@/app/admin/actions";
import { LessonStudio } from "@/components/teacher/lesson-studio";
import { ResourceUploadForm } from "@/components/admin/resource-upload-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminCourses, getCourseLessons, getCourseResources } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { formatBytes, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Class content" };
export const dynamic = "force-dynamic";

type Search = { course?: string; deleted?: string; lessonDeleted?: string };

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const filters = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-card p-8">
        <h1 className="text-xl font-bold">Class content</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Videos and PDF/Word/EPUB books are stored in Supabase. Add your project keys and run the course resources
          migration to manage class content here.
        </p>
      </div>
    );
  }

  const courses = await getAdminCourses();
  if (courses.length === 0) {
    return (
      <div className="admin-card px-6 py-14 text-center">
        <BookOpen size={26} className="mx-auto text-[var(--muted)]" />
        <h1 className="mt-3 text-lg font-bold">Create a class first</h1>
        <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
          Class content is attached to a course. Create a course, then add video lessons and handouts here.
        </p>
        <Link href="/admin/courses/new" className="btn btn-primary btn-sm mt-4">
          Create a course
        </Link>
      </div>
    );
  }

  const selected = courses.find((course) => course.id === filters.course) ?? courses[0];
  const [lessons, resources] = await Promise.all([
    getCourseLessons(selected.id),
    getCourseResources(selected.id),
  ]);
  const totalResources = courses.length ? resources.length : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Academy</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Class content</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add videos and upload PDF, Word or EPUB books and documents for each class.
          </p>
        </div>
        <Link href={`/courses/${selected.slug}`} target="_blank" className="btn btn-sm self-start sm:self-auto">
          <ExternalLink size={14} /> Preview class
        </Link>
      </div>

      {filters.deleted && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-2.5 text-xs font-medium text-[var(--success)]">
          Document removed from the class.
        </p>
      )}

      {filters.lessonDeleted && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-2.5 text-xs font-medium text-[var(--success)]">
          Lesson removed from the class.
        </p>
      )}

      <section className="admin-card p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="field flex-1">
            <span className="label">Class</span>
            <select name="course" defaultValue={selected.id} className="input">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.emoji} {course.title}
                  {course.published ? "" : " (draft)"}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-sm sm:mb-0.5">
            <FolderOpen size={14} /> Open class
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl text-lg"
            style={{ background: `linear-gradient(135deg, ${selected.gradient})` }}
          >
            {selected.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{selected.title}</p>
            <p className="text-[11px] text-[var(--muted)]">
              {selected.category} · {selected.level} · {selected.published ? "Live" : "Draft"}
            </p>
          </div>
          <span className="badge badge-muted">
            <Video size={11} /> {lessons.length} videos
          </span>
          <span className="badge badge-muted">
            <FileText size={11} /> {totalResources} documents
          </span>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <Video size={17} />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Videos</h2>
              <p className="text-[11px] text-[var(--muted)]">Upload MP4/WebM/MOV videos up to 500 MB or use YouTube.</p>
            </div>
          </div>
          <LessonStudio
            courseId={selected.id}
            lessons={lessons}
            actions={{
              prepare: prepareAdminVideoUploadAction,
              save: saveAdminLessonAction,
              delete: deleteAdminLessonAction,
            }}
          />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] text-[var(--accent-2)]">
              <FileText size={17} />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Books &amp; documents</h2>
              <p className="text-[11px] text-[var(--muted)]">PDF books, DOC, DOCX and EPUB files for this class.</p>
            </div>
          </div>

          <section className="admin-card p-5">
            <ResourceUploadForm courseId={selected.id} />

            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Uploaded documents
              </p>

              {resources.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center">
                  <Layers size={20} className="mx-auto text-[var(--muted)]" />
                  <p className="mt-2 text-xs text-[var(--muted)]">No handouts for this class yet.</p>
                </div>
              ) : (
                <ul className="mt-2 divide-y divide-[var(--line)]">
                  {resources.map((resource) => (
                    <li key={resource.id} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] text-[var(--muted)]">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{resource.title}</p>
                        <p className="truncate text-[11px] text-[var(--muted)]">
                          {resource.fileName} · {formatBytes(resource.sizeBytes)} · {formatDate(resource.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="badge badge-muted">Unavailable</span>
                        )}
                        <form action={deleteResourceAction}>
                          <input type="hidden" name="id" value={resource.id} />
                          <ConfirmButton
                            message={`Delete “${resource.title}”? The file will be removed from storage.`}
                            className="btn btn-sm"
                          >
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
