import type { Metadata } from "next";
import Link from "next/link";
import { Download, GraduationCap, Search, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react";
import { setRoleAction } from "@/app/admin/actions";
import { LocalEmptyPage } from "@/components/admin/local-empty-page";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminUserEmails } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { roleLabel } from "@/lib/roles";
import { getAdminClient } from "@/lib/supabase/admin-data";
import type { Role } from "@/lib/types";
import { formatDate, initials, percent, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Students" };
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
};

type EnrollmentRow = {
  user_id: string;
  status: string;
  created_at: string;
  courses?: { title: string } | { title: string }[] | null;
};

function courseTitle(row: EnrollmentRow) {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  return course?.title ?? null;
}

type Filters = { q?: string; role?: string };

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const current = await requireAdmin();
  const filters = await searchParams;
  const query = (filters.q ?? "").trim();
  const role = ["student", "teacher", "admin", "super_admin"].includes(filters.role ?? "") ? filters.role : "all";
  const canManageRoles = current.profile.role === "super_admin";

  if (!isSupabaseConfigured) {
    return (
      <LocalEmptyPage
        eyebrow="People"
        title="Students"
        description="Accounts, enrolments and administrator access."
        banner="Student accounts live in Supabase Auth. Connect your project to sign learners up, track progress and manage admin access."
        stats={[
          { label: "Accounts", value: 0, hint: "Awaiting Supabase", icon: Users },
          { label: "Enrolled learners", value: 0, hint: "No local records", icon: GraduationCap },
          { label: "Administrators", value: 1, hint: "Local preview admin", icon: ShieldCheck },
        ]}
        columns={["Student", "Email", "Joined", "Enrolments", "Courses", "Completion", "Last activity", "Role", "Action"]}
        emptyTitle="No local student accounts"
        emptyDescription="Sign-ups, enrolments and role changes are stored in Supabase. Add your project keys, run the migration and seed script, then create your first account."
      />
    );
  }

  const admin = await getAdminClient();
  const [{ data: profileRows }, { data: enrollmentRows }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("enrollments").select("user_id, status, created_at, courses(title)"),
  ]);

  const profiles = (profileRows ?? []) as ProfileRow[];
  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[];
  const emails = await getAdminUserEmails();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const rows = profiles.map((profile) => {
    const own = enrollments.filter((enrollment) => enrollment.user_id === profile.id);
    const completed = own.filter((enrollment) => enrollment.status === "completed").length;
    const latest = own.reduce<string | null>(
      (value, enrollment) => (!value || enrollment.created_at > value ? enrollment.created_at : value),
      null,
    );
    const courseTitles = Array.from(
      new Set(own.map((enrollment) => courseTitle(enrollment)).filter(Boolean) as string[]),
    );
    return {
      ...profile,
      email: emails.get(profile.id) ?? "—",
      total: own.length,
      completed,
      latest,
      courseTitles,
    };
  });

  const filtered = rows.filter((row) => {
    const matchesRole = role === "all" || row.role === role;
    const haystack = `${row.full_name} ${row.email}`.toLowerCase();
    return matchesRole && haystack.includes(query.toLowerCase());
  });

  const enrolled = new Set(enrollments.map((enrollment) => enrollment.user_id)).size;
  const admins = profiles.filter((profile) => profile.role === "admin" || profile.role === "super_admin").length;
  const teachers = profiles.filter((profile) => profile.role === "teacher").length;
  const newThisMonth = profiles.filter((profile) => new Date(profile.created_at) >= monthStart).length;

  const hrefFor = (nextRole: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextRole !== "all") params.set("role", nextRole);
    const suffix = params.toString();
    return `/admin/students${suffix ? `?${suffix}` : ""}`;
  };

  const tabs = [
    { value: "all", label: "All accounts", count: profiles.length },
    { value: "student", label: "Students", count: profiles.length - admins - teachers },
    { value: "teacher", label: "Teachers", count: teachers },
    { value: "admin", label: "Admins", count: admins },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">People</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Accounts, enrolments and administrator access.</p>
        </div>
        <a href="/admin/export?type=students" className="btn btn-sm self-start sm:self-auto">
          <Download size={14} /> Export students
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Accounts", value: profiles.length, icon: Users, hint: `${newThisMonth} new this month` },
          { label: "Enrolled learners", value: enrolled, icon: GraduationCap, hint: `${enrollments.length} enrolments` },
          { label: "Teachers", value: teachers, icon: UserCog, hint: "Teaching accounts" },
          { label: "Administrators", value: admins, icon: ShieldCheck, hint: "Full platform access" },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <Link key={tab.value} href={hrefFor(tab.value)} className="admin-tab" data-active={role === tab.value}>
                {tab.label}
                <span className="rounded bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-bold">
                  {tab.count}
                </span>
              </Link>
            ))}
          </div>

          <form action="/admin/students" className="flex w-full gap-2 lg:w-auto">
            {role !== "all" && <input type="hidden" name="role" value={role} />}
            <label className="relative flex-1 lg:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search name or email…"
                className="input h-9 py-0 pl-8 text-xs"
                aria-label="Search students"
              />
            </label>
            <button type="submit" className="btn btn-sm">Search</button>
            {query && <Link href={hrefFor(role as string)} className="btn btn-ghost btn-sm">Clear</Link>}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[1120px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Enrolments</th>
                <th>Courses</th>
                <th>Completion</th>
                <th>Last activity</th>
                <th>Role</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelf = row.id === current.id;
                const rate = percent(row.completed, row.total);
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[11px] font-bold text-white">
                          {initials(row.full_name || "U")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{row.full_name || "Unnamed student"}</p>
                          <p className="text-[10px] text-[var(--muted)]">{isSelf ? "You" : "Learner account"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[var(--muted)]">{row.email}</td>
                    <td className="text-[var(--muted)]">{formatDate(row.created_at)}</td>
                    <td className="font-semibold">{row.total}</td>
                    <td>
                      {row.courseTitles.length === 0 ? (
                        <span className="text-[11px] text-[var(--muted)]">—</span>
                      ) : (
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {row.courseTitles.slice(0, 2).map((title) => (
                            <span key={title} className="badge badge-muted">{title}</span>
                          ))}
                          {row.courseTitles.length > 2 && (
                            <span className="badge badge-muted">+{row.courseTitles.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress h-1.5 w-16">
                          <span style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-[11px] text-[var(--muted)]">{row.completed}/{row.total}</span>
                      </div>
                    </td>
                    <td className="text-[11px] text-[var(--muted)]">{row.latest ? timeAgo(row.latest) : "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.role === "super_admin" || row.role === "admin"
                            ? "badge-accent"
                            : row.role === "teacher"
                              ? "badge-success"
                              : "badge-muted"
                        }`}
                      >
                        {roleLabel(row.role)}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        {isSelf ? (
                          <span className="text-[11px] text-[var(--muted)]">You</span>
                        ) : canManageRoles && row.role !== "super_admin" ? (
                          <form action={setRoleAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="userId" value={row.id} />
                            <select
                              name="role"
                              defaultValue={row.role}
                              className="select h-8 w-28 py-0 text-xs"
                              aria-label={`Role for ${row.full_name || "this user"}`}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                            <ConfirmButton
                              message={`Change the role for ${row.full_name || "this user"}?`}
                              className="btn btn-sm"
                            >
                              Save
                            </ConfirmButton>
                          </form>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <UserPlus size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">{profiles.length === 0 ? "No accounts yet" : "No matching accounts"}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {profiles.length === 0 ? "Students appear here after signing up." : "Try a different search or role filter."}
            </p>
            {profiles.length > 0 && <Link href="/admin/students" className="btn btn-sm mt-4">Reset filters</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
