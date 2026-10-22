import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import {
  Download,
  ExternalLink,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { LocalModeBanner } from "@/components/admin/local-mode-banner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireAdmin } from "@/lib/auth";
import { deleteCourseAction, toggleCoursePublishAction } from "@/app/admin/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { fixtureCourses } from "@/lib/fixtures";
import { naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

type AdminCourseRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  emoji: string;
  gradient: string;
  price_kobo: number;
  published: boolean;
  lessons: { count: number }[] | null;
  enrollments: { count: number }[] | null;
};

type Filters = { q?: string; status?: string };

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin();
  const filters = await searchParams;
  const query = (filters.q ?? "").trim();
  const status = ["published", "draft"].includes(filters.status ?? "") ? filters.status : "all";

  const localMode = !isSupabaseAdminConfigured;
  let courses: AdminCourseRow[];

  if (localMode) {
    courses = fixtureCourses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      category: course.category,
      level: course.level,
      emoji: course.emoji,
      gradient: course.gradient,
      price_kobo: course.priceKobo,
      published: course.published,
      lessons: [{ count: course.lessonsCount ?? 0 }],
      enrollments: [{ count: course.studentsCount ?? 0 }],
    }));
  } else {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("courses")
      .select("*, lessons(count), enrollments(count)")
      .order("created_at", { ascending: true });
    courses = (data ?? []) as AdminCourseRow[];
  }
  const learners = courses.reduce((sum, course) => sum + (course.enrollments?.[0]?.count ?? 0), 0);
  const published = courses.filter((course) => course.published).length;

  const filtered = courses.filter((course) => {
    const matchesStatus =
      status === "all" || (status === "published" ? course.published : !course.published);
    const haystack = `${course.title} ${course.slug} ${course.category} ${course.level}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  });

  const hrefFor = (nextStatus: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextStatus !== "all") params.set("status", nextStatus);
    const suffix = params.toString();
    return `/admin/courses${suffix ? `?${suffix}` : ""}`;
  };

  const tabs = [
    { value: "all", label: "All courses", count: courses.length },
    { value: "published", label: "Published", count: published },
    { value: "draft", label: "Drafts", count: courses.length - published },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Catalogue</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {courses.length} courses · {published} published · {learners.toLocaleString()} enrolments
            {localMode && " · sample data"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!localMode && (
            <Link href="/admin/export?type=courses" className="btn btn-sm">
              <Download size={14} /> Export
            </Link>
          )}
          <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
            <Plus size={15} /> New course
          </Link>
        </div>
      </div>

      {localMode && (
        <LocalModeBanner message="These are the bundled fixture courses. Publishing, editing and deleting are disabled until Supabase is connected." />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total courses", value: courses.length, icon: Layers },
          { label: "Live", value: published, icon: ExternalLink },
          { label: "Drafts", value: courses.length - published, icon: Pencil },
          { label: "Enrolments", value: learners, icon: Users },
        ].map((stat) => (
          <div key={stat.label} className="admin-card flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
              <p className="text-lg font-bold leading-tight">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={hrefFor(tab.value)}
                className="admin-tab"
                data-active={status === tab.value}
              >
                {tab.label}
                <span className="rounded bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-bold">
                  {tab.count}
                </span>
              </Link>
            ))}
          </div>

          <form action="/admin/courses" className="flex w-full gap-2 lg:w-auto">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <label className="relative flex-1 lg:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search courses…"
                className="input h-9 py-0 pl-8 text-xs"
                aria-label="Search courses"
              />
            </label>
            <button type="submit" className="btn btn-sm">Search</button>
            {query && <Link href={hrefFor(status as string)} className="btn btn-ghost btn-sm">Clear</Link>}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[820px]">
            <thead>
              <tr>
                <th>Course</th>
                <th>Price</th>
                <th>Lessons</th>
                <th>Students</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${course.gradient || "#0a84ff,#6d5efc"})` }}
                      >
                        {course.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{course.title}</p>
                        <p className="truncate text-[11px] text-[var(--muted)]">
                          {course.category} · {course.level} · /{course.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="font-semibold">{naira(course.price_kobo)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                      <Layers size={13} /> {course.lessons?.[0]?.count ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} className="text-[var(--muted)]" />
                      <strong>{course.enrollments?.[0]?.count ?? 0}</strong>
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${course.published ? "badge-success" : "badge-muted"}`}>
                      {course.published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {localMode ? (
                        <>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Read-only</span>
                          <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-sm">
                            <ExternalLink size={13} /> Preview
                          </Link>
                        </>
                      ) : (
                        <>
                          <form action={toggleCoursePublishAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="published" value={String(!course.published)} />
                            <button type="submit" className="btn btn-sm">
                              {course.published ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                          <Link href={`/admin/courses/${course.id}`} className="btn btn-sm">
                            <Pencil size={13} /> Edit
                          </Link>
                          <Link href={`/courses/${course.slug}`} target="_blank" className="btn icon-btn btn-sm" title="View course">
                            <ExternalLink size={13} />
                          </Link>
                          <form action={deleteCourseAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <ConfirmButton
                              message={`Delete “${course.title}”? Lessons, enrolments, payments and certificates for this course will be removed.`}
                              className="btn btn-danger icon-btn btn-sm"
                            >
                              <Trash2 size={13} />
                            </ConfirmButton>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Layers size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">{courses.length === 0 ? "No courses yet" : "No matching courses"}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {courses.length === 0 ? "Create your first course to start building the catalogue." : "Try a different search or status filter."}
            </p>
            {courses.length === 0 ? (
              <Link href="/admin/courses/new" className="btn btn-primary btn-sm mt-4">
                <Plus size={14} /> Create course
              </Link>
            ) : (
              <Link href="/admin/courses" className="btn btn-sm mt-4">Reset filters</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
