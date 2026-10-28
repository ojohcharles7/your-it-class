import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ExternalLink, Pencil, Plus, Users } from "lucide-react";
import { requireInstructor } from "@/lib/auth";
import { getTeacherCourses } from "@/lib/data";
import { naira } from "@/lib/utils";

export const metadata: Metadata = { title: "My courses" };
export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  published: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
  draft: "badge-muted",
};

export default async function InstructorCoursesPage() {
  const current = await requireInstructor();
  const courses = await getTeacherCourses(current.id);
  const owned = courses.filter((course) => course.isOwner);
  const assistants = courses.filter((course) => !course.isOwner);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Studio</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">My courses</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create courses, build the curriculum and submit them for admin approval.
          </p>
        </div>
        <Link href="/instructor/courses/new" className="btn btn-primary btn-sm self-start sm:self-auto">
          <Plus size={15} /> New course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="admin-card px-6 py-16 text-center">
          <BookOpen size={26} className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-3 text-base font-semibold">Start your first course</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
            Add the course details, upload lessons and set a final exam. You can save it as a draft until it is ready.
          </p>
          <Link href="/instructor/courses/new" className="btn btn-primary btn-sm mt-4">
            <Plus size={14} /> Create a course
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <CourseGroup title="Courses you own" courses={owned} empty="You have not created a course yet." />
          {assistants.length > 0 && (
            <CourseGroup title="Assisting on" courses={assistants} empty="" />
          )}
        </div>
      )}
    </div>
  );
}

function CourseGroup({
  title,
  courses,
  empty,
}: {
  title: string;
  courses: Awaited<ReturnType<typeof getTeacherCourses>>;
  empty: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="badge badge-muted">{courses.length}</span>
      </div>
      {courses.length === 0 ? (
        <p className="admin-card p-5 text-xs text-[var(--muted)]">{empty}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="admin-card p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
                  style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                >
                  {course.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{course.title}</h3>
                    <span className={`badge ${statusStyles[course.reviewStatus ?? "draft"] ?? "badge-muted"}`}>
                      {course.reviewStatus ?? "draft"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                    {course.category} · {course.level} · {course.lessonsCount ?? 0} lessons
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-3 text-center">
                <div>
                  <p className="text-sm font-bold">{course.paidStudents}</p>
                  <p className="text-[10px] text-[var(--muted)]">Learners</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{naira(course.priceKobo)}</p>
                  <p className="text-[10px] text-[var(--muted)]">Price</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{naira(course.earningsKobo)}</p>
                  <p className="text-[10px] text-[var(--muted)]">Earnings</p>
                </div>
              </div>

              {course.reviewNote && course.reviewStatus === "rejected" && (
                <p className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-2.5 text-[11px] leading-relaxed text-[var(--danger)]">
                  {course.reviewNote}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/instructor/courses/${course.id}`} className="btn btn-sm">
                  <Pencil size={13} /> {course.isOwner ? "Manage course" : "View course"}
                </Link>
                <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                  <ExternalLink size={13} /> Public page
                </Link>
                <Link href={`/instructor/students?course=${course.id}`} className="btn btn-ghost btn-sm">
                  <Users size={13} /> Students
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
