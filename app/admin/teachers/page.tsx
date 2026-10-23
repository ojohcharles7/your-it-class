import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { BookOpen, GraduationCap, ShieldCheck, UserCog, Users } from "lucide-react";
import { assignTeacherCoursesAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminCourses, getAdminTeachers } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { roleLabel } from "@/lib/roles";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Instructors" };
export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const current = await requireAdmin();
  const isSuper = current.profile.role === "super_admin";

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-card p-8">
        <h1 className="text-xl font-bold">Instructors</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Instructor roles, course ownership and class assignments are stored in Supabase. Add your project keys and
          run the instructor platform migration to manage them here.
        </p>
      </div>
    );
  }

  const [teachers, courses] = await Promise.all([getAdminTeachers(), getAdminCourses()]);
  const assignedClasses = teachers.reduce((sum, teacher) => sum + teacher.courseIds.length, 0);
  const ownedCourses = teachers.reduce((sum, teacher) => sum + teacher.ownedCourseIds.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">People</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Instructors</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View instructor accounts and assign the classes they assist on. Master handles roles, ownership and shares.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/students" className="btn btn-sm">
            <Users size={14} /> All accounts
          </Link>
          {isSuper && (
            <Link href="/master/instructors" className="btn btn-primary btn-sm">
              <UserCog size={14} /> Master controls
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Instructors", value: teachers.length, icon: UserCog, hint: "Teaching accounts" },
          { label: "Owner courses", value: ownedCourses, icon: GraduationCap, hint: "Primary ownership" },
          { label: "Assigned classes", value: assignedClasses, icon: BookOpen, hint: "Read-only assistance" },
          { label: "Your access", value: roleLabel(current.profile.role), icon: ShieldCheck, hint: "View and assign" },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
        Admins can assign assistants to courses. Creating instructor accounts, approving applications, setting revenue
        shares and transferring primary ownership happen in the master console.
      </p>

      <div className="space-y-3">
        {teachers.map((teacher) => {
          const assigned = courses.filter((course) => teacher.courseIds.includes(course.id));
          const owned = courses.filter((course) => teacher.ownedCourseIds.includes(course.id));
          return (
            <section key={teacher.id} className="admin-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
                  {initials(teacher.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{teacher.fullName}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {teacher.email} · joined {formatDate(teacher.createdAt)}
                  </p>
                </div>
                <span className="badge badge-accent">Instructor</span>
                {teacher.revenueSharePercent > 0 && (
                  <span className="badge badge-muted">{teacher.revenueSharePercent}% share</span>
                )}
                {teacher.slug && teacher.isPublic && (
                  <Link href={`/instructors/${teacher.slug}`} className="btn btn-ghost btn-sm">
                    Public profile
                  </Link>
                )}
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Primary owner</p>
                    {owned.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {owned.map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] px-2 py-1 text-[11px] font-medium"
                          >
                            <span>{course.emoji}</span>
                            {course.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">No owned courses.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Assigned to assist</p>
                    {assigned.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {assigned.map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-medium"
                          >
                            <span>{course.emoji}</span>
                            {course.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">No classes assigned.</p>
                    )}
                  </div>
                </div>

                <form action={assignTeacherCoursesAction} className="rounded-xl border border-[var(--line)] p-3">
                  <input type="hidden" name="teacherId" value={teacher.id} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Assign classes</p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">Assistants can view and edit content, but only the owner earns.</p>
                  <div className="mt-2 grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
                    {courses.map((course) => (
                      <label key={course.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]">
                        <input
                          type="checkbox"
                          name="courseIds"
                          value={course.id}
                          defaultChecked={teacher.courseIds.includes(course.id)}
                          className="h-3.5 w-3.5 accent-[var(--accent)]"
                        />
                        <span className="min-w-0 truncate">
                          {course.emoji} {course.title}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm mt-3">
                    Save classes
                  </button>
                </form>
              </div>
            </section>
          );
        })}

        {teachers.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <UserCog size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">No instructors yet</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Approved applications and promoted accounts will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
