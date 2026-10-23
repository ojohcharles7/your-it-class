import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  FileText,
  Layers,
  ListChecks,
  Send,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  deleteInstructorCourseAction,
  deleteInstructorLessonAction,
  deleteInstructorResourceAction,
  prepareInstructorResourceUploadAction,
  prepareInstructorVideoUploadAction,
  saveInstructorCourseAction,
  saveInstructorLessonAction,
  saveInstructorResourceUploadAction,
  submitInstructorCourseAction,
} from "@/app/instructor/actions";
import { CourseForm } from "@/components/admin/course-form";
import { ResourceUploadForm } from "@/components/admin/resource-upload-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { LessonStudio } from "@/components/teacher/lesson-studio";
import { ExamEditor } from "@/components/instructor/exam-editor";
import { requireInstructor } from "@/lib/auth";
import {
  getCourseResources,
  getExamEditorData,
  getTeacherStudioCourse,
} from "@/lib/data";
import { formatBytes, formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage course" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; submitted?: string; deleted?: string; error?: string }>;
};

const statusStyles: Record<string, string> = {
  published: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
  draft: "badge-muted",
};

export default async function InstructorCoursePage({ params, searchParams }: Props) {
  const current = await requireInstructor();
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const studio = await getTeacherStudioCourse(current.id, id);
  if (!studio) notFound();

  const { course, lessons } = studio;
  const isOwner = course.instructorId === current.id;
  const [resources, examData] = await Promise.all([
    getCourseResources(course.id),
    getExamEditorData(course.id),
  ]);

  const stats = [
    { label: "Lessons", value: lessons.length, icon: Layers },
    { label: "Students", value: course.studentsCount ?? 0, icon: Users },
    { label: "Price", value: naira(course.priceKobo), icon: Wallet },
    { label: "Exam questions", value: examData.questions.length, icon: ListChecks },
  ];

  const status = course.reviewStatus ?? (course.published ? "published" : "draft");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/instructor/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={14} /> Back to my courses
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-sm"
              style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
            >
              {course.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
                <span className={`badge ${statusStyles[status] ?? "badge-muted"}`}>{status}</span>
                {!isOwner && <span className="badge badge-muted">Assistant view</span>}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {course.category} · {course.level} · /courses/{course.slug}
              </p>
            </div>
          </div>
          {course.published && (
            <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-sm self-start sm:self-auto">
              <ExternalLink size={14} /> View public page
            </Link>
          )}
        </div>
      </div>

      {flags.created && (
        <Notice tone="success">Course created. Add lessons, handouts and a final exam, then submit it for approval.</Notice>
      )}
      {flags.submitted && (
        <Notice tone="success">Course submitted. The master account will review it before it goes live.</Notice>
      )}
      {flags.deleted && <Notice tone="success">Item removed.</Notice>}
      {flags.error && <Notice tone="danger">{decodeURIComponent(flags.error)}</Notice>}
      {status === "pending" && (
        <Notice tone="warning">This course is waiting for master approval. You can keep editing it while it is in review.</Notice>
      )}
      {status === "rejected" && (
        <Notice tone="danger">
          {course.reviewNote || "This course was returned for changes. Update it and submit it again."}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {isOwner ? (
        <>
          <section className="admin-card p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Course details</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Changes to a published course go live immediately. The master account can unpublish it.
                </p>
              </div>
              <form action={submitInstructorCourseAction}>
                <input type="hidden" name="id" value={course.id} />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={status === "pending"}
                >
                  {status === "pending" ? <CheckCircle2 size={14} /> : <Send size={14} />}
                  {status === "pending" ? "In review" : status === "rejected" ? "Resubmit for review" : "Submit for review"}
                </button>
              </form>
            </div>
            <CourseForm
              course={course}
              action={saveInstructorCourseAction}
              basePath="/instructor/courses"
              canPublish={false}
            />
          </section>

          <LessonStudio
            courseId={course.id}
            lessons={lessons}
            actions={{
              prepare: prepareInstructorVideoUploadAction,
              save: saveInstructorLessonAction,
              delete: deleteInstructorLessonAction,
            }}
          />

          <section className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Books &amp; documents</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">PDF books, DOC, DOCX and EPUB files for this course.</p>
              </div>
              <FileText size={18} className="text-[var(--accent-2)]" />
            </div>

            <div className="mt-4">
              <ResourceUploadForm
                courseId={course.id}
                prepareAction={prepareInstructorResourceUploadAction}
                saveAction={saveInstructorResourceUploadAction}
              />
            </div>

            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Uploaded books & documents</p>
              {resources.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-[var(--muted)]">
                  No books or documents for this course yet.
                </p>
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
                        {resource.url && (
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                            Open
                          </a>
                        )}
                        <form action={deleteInstructorResourceAction}>
                          <input type="hidden" name="id" value={resource.id} />
                          <input type="hidden" name="courseId" value={course.id} />
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

          <ExamEditor
            courseId={course.id}
            exam={examData.exam}
            questions={examData.questions}
          />

          {status === "draft" && (course.studentsCount ?? 0) === 0 && (
            <section className="admin-card flex flex-wrap items-center gap-3 border-[color-mix(in_srgb,var(--danger)_25%,transparent)] p-4">
              <AlertCircle size={18} className="text-[var(--danger)]" />
              <p className="min-w-0 flex-1 text-xs text-[var(--muted)]">
                Deleting this draft also removes its lessons, exam and uploaded files.
              </p>
              <form action={deleteInstructorCourseAction}>
                <input type="hidden" name="id" value={course.id} />
                <ConfirmButton message={`Delete “${course.title}”? This cannot be undone.`} className="btn btn-danger btn-sm">
                  <Trash2 size={13} /> Delete draft
                </ConfirmButton>
              </form>
            </section>
          )}
        </>
      ) : (
        <section className="admin-card p-5">
          <h2 className="text-base font-semibold">Assistant instructor access</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            You can see this course and its learners, but only the primary instructor can edit it or manage earnings.
          </p>
          <Link href={`/instructor/students?course=${course.id}`} className="btn btn-sm mt-4">
            <Users size={14} /> View students
          </Link>
        </section>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: "success" | "warning" | "danger"; children: React.ReactNode }) {
  const styles = {
    success: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_9%,transparent)] text-[var(--success)]",
    warning: "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_9%,transparent)] text-[var(--warning)]",
    danger: "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] text-[var(--danger)]",
  };
  return <p className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles[tone]}`}>{children}</p>;
}
