import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Globe, UserCog, UserPlus } from "lucide-react";
import {
  assignCourseOwnerAction,
  promoteInstructorAction,
  setInstructorShareAction,
} from "@/app/master/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getAdminCourses, getInstructors } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { initials, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Instructors" };
export const dynamic = "force-dynamic";

export default async function MasterInstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";
  const configured = !localMode && isSupabaseConfigured;
  const [instructors, courses] = configured ? await Promise.all([getInstructors(), getAdminCourses()]) : [[], []];
  const nameById = new Map(instructors.map((instructor) => [instructor.userId, instructor.fullName]));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Instructors</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Set revenue shares, control public profiles and assign primary course ownership.
        </p>
      </div>

      {params.ok && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          {params.ok}
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {params.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Instructors", value: instructors.length },
          { label: "Owned courses", value: courses.filter((course) => course.instructorId).length },
          { label: "Unassigned courses", value: courses.filter((course) => !course.instructorId).length },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="admin-card p-5">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-sm font-semibold">Promote an existing account</h2>
            <p className="text-[11px] text-[var(--muted)]">Move a student or admin account into the instructor role.</p>
          </div>
        </div>
        <form action={promoteInstructorAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input name="email" type="email" className="input sm:max-w-sm" placeholder="account@email.com" required />
          <button type="submit" className="btn btn-sm self-start">Promote to instructor</button>
        </form>
      </section>

      <section className="space-y-4">
        {instructors.map((instructor) => {
          const owned = courses.filter((course) => course.instructorId === instructor.userId);
          return (
            <article key={instructor.userId} className="admin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
                    {initials(instructor.fullName || "Instructor")}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{instructor.fullName}</h2>
                    <p className="truncate text-xs text-[var(--muted)]">{instructor.email}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {instructor.courseCount ?? owned.length} courses · {instructor.studentCount ?? 0} students
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`badge ${instructor.isPublic ? "badge-success" : "badge-muted"}`}>
                    {instructor.isPublic ? "Public" : "Hidden"}
                  </span>
                  <span className="badge badge-accent">{instructor.revenueSharePercent}% share</span>
                  {instructor.isPublic && (
                    <Link href={`/instructors/${instructor.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                      <ExternalLink size={13} /> Profile
                    </Link>
                  )}
                </div>
              </div>

              <form action={setInstructorShareAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                <input type="hidden" name="userId" value={instructor.userId} />
                <div className="field mb-0 w-32">
                  <label className="label text-[10px]">Revenue share %</label>
                  <input
                    name="sharePercent"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={instructor.revenueSharePercent}
                    className="input h-9 text-xs"
                  />
                </div>
                <label className="flex h-9 items-center gap-2 text-xs">
                  <input type="checkbox" name="isPublic" defaultChecked={instructor.isPublic} className="h-4 w-4 accent-[var(--accent)]" />
                  Public profile
                </label>
                <button type="submit" className="btn btn-sm">Save</button>
              </form>

              {owned.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {owned.map((course) => (
                    <span key={course.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-solid)] px-2 py-1 text-[11px]">
                      {course.emoji} {course.title}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        {instructors.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <UserCog size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">No instructors yet</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Approve an application or promote an existing account.</p>
          </div>
        )}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-sm font-semibold">Course ownership</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            The primary owner controls the course and receives earnings. Assistants stay read-only.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[760px]">
            <thead>
              <tr>
                <th>Course</th>
                <th>Price</th>
                <th>Current owner</th>
                <th>Set primary owner</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <p className="font-semibold">{course.emoji} {course.title}</p>
                    <p className="text-[10px] text-[var(--muted)]">{course.reviewStatus ?? "draft"} · {course.published ? "published" : "unpublished"}</p>
                  </td>
                  <td>{naira(course.priceKobo)}</td>
                  <td>
                    <span className={course.instructorId ? "font-medium" : "text-[var(--muted)]"}>
                      {course.instructorId ? nameById.get(course.instructorId) ?? "Instructor" : "Unassigned"}
                    </span>
                  </td>
                  <td>
                    <form action={assignCourseOwnerAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="courseId" value={course.id} />
                      <select name="userId" defaultValue={course.instructorId ?? ""} className="input h-8 min-w-[150px] py-0 text-xs">
                        <option value="">Unassigned</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.userId} value={instructor.userId}>
                            {instructor.fullName}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-sm h-8">Set</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {courses.length === 0 && (
          <div className="px-6 py-10 text-center text-xs text-[var(--muted)]">No courses available.</div>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
        <Globe size={12} /> Public instructor profiles appear at <code>/instructors/[slug]</code>.
      </p>
    </div>
  );
}
