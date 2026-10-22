import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { BookOpen, GraduationCap, Mail, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react";
import {
  assignTeacherCoursesAction,
  promoteTeacherAction,
  removeTeacherAction,
} from "@/app/admin/actions";
import { TeacherCreateForm } from "@/components/admin/teacher-create-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminCourses, getAdminTeachers } from "@/lib/data";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { roleLabel } from "@/lib/roles";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Teachers" };
export const dynamic = "force-dynamic";

type Filters = { added?: string; error?: string };

export default async function AdminTeachersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const current = await requireAdmin();
  const filters = await searchParams;
  const isSuper = current.profile.role === "super_admin";

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-card p-8">
        <h1 className="text-xl font-bold">Teachers</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Teacher roles and class assignments are stored in Supabase. Add your project keys and run the teachers
          migration to manage them here.
        </p>
      </div>
    );
  }

  const [teachers, courses] = await Promise.all([getAdminTeachers(), getAdminCourses()]);
  const assignedClasses = teachers.reduce((sum, teacher) => sum + teacher.courseIds.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">People</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Teachers</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Give teachers their own workspace and assign the classes they teach.
          </p>
        </div>
        <Link href="/admin/students" className="btn btn-sm self-start sm:self-auto">
          <Users size={14} /> All accounts
        </Link>
      </div>

      {filters.added && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-2.5 text-xs font-medium text-[var(--success)]">
          Teacher role saved.
        </p>
      )}
      {filters.error === "notfound" && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-2.5 text-xs font-medium text-[var(--danger)]">
          No account found with that email. Ask the teacher to sign up first, then try again.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Teachers", value: teachers.length, icon: UserCog, hint: "Teaching accounts" },
          { label: "Classes assigned", value: assignedClasses, icon: BookOpen, hint: "Teacher ↔ class links" },
          { label: "Courses available", value: courses.length, icon: GraduationCap, hint: "Across the catalogue" },
          { label: "Your access", value: roleLabel(current.profile.role), icon: ShieldCheck, hint: isSuper ? "Can manage roles" : "View only" },
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

      {isSuper ? (
        <section className="admin-card p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Add a teacher</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Create a login for a tech teacher, then assign the classes they teach below.{" "}
                {isSupabaseAdminConfigured
                  ? "The account is confirmed automatically."
                  : "The teacher may need to confirm their email before first login. Add SUPABASE_SERVICE_ROLE_KEY to skip confirmation."}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <TeacherCreateForm />
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Or promote an existing account
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Already signed up as a student? Enter their email to switch the account to a teacher.
            </p>
            <form action={promoteTeacherAction} className="mt-2 flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  name="email"
                  type="email"
                  className="input pl-8"
                  placeholder="Existing account email"
                  aria-label="Existing account email"
                  required
                />
              </label>
              <button type="submit" className="btn btn-sm">
                <UserPlus size={14} /> Make teacher
              </button>
            </form>
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
          Only a super admin can create teacher roles and assign classes.
        </p>
      )}

      <div className="space-y-3">
        {teachers.map((teacher) => {
          const assigned = courses.filter((course) => teacher.courseIds.includes(course.id));
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
                <span className="badge badge-accent">Teacher</span>
                {isSuper && (
                  <form action={removeTeacherAction}>
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <ConfirmButton
                      message={`Remove teacher access from ${teacher.fullName}? Their class assignments will be cleared.`}
                      className="btn btn-sm"
                    >
                      Remove teacher
                    </ConfirmButton>
                  </form>
                )}
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Teaching</p>
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
                    <p className="mt-2 text-xs text-[var(--muted)]">No classes assigned yet.</p>
                  )}
                </div>

                {isSuper && (
                  <form action={assignTeacherCoursesAction} className="rounded-xl border border-[var(--line)] p-3">
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Assign classes</p>
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
                )}
              </div>
            </section>
          );
        })}

        {teachers.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <UserCog size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">No teachers yet</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Promote a teacher above, then assign the classes they will teach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
