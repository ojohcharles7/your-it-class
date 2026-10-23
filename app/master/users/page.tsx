import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, ShieldCheck, UserCog, Users } from "lucide-react";
import { setRoleAction } from "@/app/admin/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getAdminUserEmails } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { adminRoleOptions, roleLabel } from "@/lib/roles";
import { getAdminClient } from "@/lib/supabase/admin-data";
import type { Role } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Users & roles" };
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export default async function MasterUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";

  let users: (ProfileRow & { email: string; enrollments: number })[] = [];
  if (!localMode && isSupabaseConfigured) {
    const admin = await getAdminClient();
    const [{ data: profileRows }, { data: enrollmentRows }] = await Promise.all([
      admin.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
      admin.from("enrollments").select("user_id"),
    ]);
    const emails = await getAdminUserEmails();
    const enrollmentCounts = new Map<string, number>();
    for (const row of (enrollmentRows ?? []) as { user_id: string }[]) {
      enrollmentCounts.set(row.user_id, (enrollmentCounts.get(row.user_id) ?? 0) + 1);
    }
    users = ((profileRows ?? []) as ProfileRow[]).map((profile) => ({
      ...profile,
      email: emails.get(profile.id) ?? "—",
      enrollments: enrollmentCounts.get(profile.id) ?? 0,
    }));
  }

  const counts = {
    learners: users.filter((user) => user.role === "student").length,
    instructors: users.filter((user) => user.role === "teacher").length,
    admins: users.filter((user) => user.role === "admin" || user.role === "super_admin").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Users &amp; roles</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every account on the platform. Role changes take effect immediately.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "All accounts", value: users.length, icon: Users },
          { label: "Learners", value: counts.learners, icon: GraduationCap },
          { label: "Instructors", value: counts.instructors, icon: UserCog },
          { label: "Admins", value: counts.admins, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] p-4">
          <div>
            <h2 className="text-sm font-semibold">Accounts</h2>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">You cannot change your own master role.</p>
          </div>
          <Link href="/master/instructors" className="btn btn-sm">Manage instructors</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[820px]">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Enrolments</th>
                <th>Joined</th>
                <th>Change role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const self = user.id === current.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[11px] font-bold text-white">
                          {initials(user.full_name || "User")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{user.full_name || "Unnamed account"}</p>
                          <p className="truncate text-[10px] text-[var(--muted)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === "super_admin" || user.role === "admin" ? "badge-accent" : user.role === "teacher" ? "badge-success" : "badge-muted"}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td>{user.enrollments}</td>
                    <td className="text-[11px] text-[var(--muted)]">{formatDate(user.created_at)}</td>
                    <td>
                      {self ? (
                        <span className="text-[11px] text-[var(--muted)]">Current account</span>
                      ) : (
                        <form action={setRoleAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="userId" value={user.id} />
                          <select name="role" defaultValue={user.role} className="input h-8 min-w-[130px] py-0 text-xs">
                            {adminRoleOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn btn-sm h-8">Save</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Users size={24} className="mx-auto text-[var(--muted)]" />
            <p className="mt-2 text-sm font-semibold">No accounts loaded</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {localMode ? "Local preview mode is read-only." : "Connect Supabase to list accounts."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
