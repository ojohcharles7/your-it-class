import type { Metadata } from "next";
import Link from "next/link";
import { Check, ClipboardCheck, Mail, X } from "lucide-react";
import { approveInstructorApplicationAction, rejectInstructorApplicationAction } from "@/app/master/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getInstructorApplications } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function MasterApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";
  const applications = !localMode && isSupabaseConfigured ? await getInstructorApplications() : [];
  const pending = applications.filter((row) => row.status === "pending");
  const reviewed = applications.filter((row) => row.status !== "pending");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Instructor applications</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approving an applicant promotes their account to instructor and creates their public profile.
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

      {localMode && (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-4 text-xs leading-relaxed text-[var(--warning)]">
          Local preview mode. Connect Supabase to review real applications. Approving requires a service-role key when
          the applicant has no account yet.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Waiting", value: pending.length },
          { label: "Approved", value: applications.filter((row) => row.status === "approved").length },
          { label: "Rejected", value: applications.filter((row) => row.status === "rejected").length },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Pending review</h2>
        {pending.map((application) => (
          <article key={application.id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">{application.fullName}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Mail size={12} /> {application.email}
                  {application.phone && <span>· {application.phone}</span>}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">Applied {formatDate(application.createdAt)}</p>
              </div>
              <span className="badge badge-warning">pending</span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Course topic</p>
                <p className="mt-1 text-sm">{application.courseTopic}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Experience</p>
                <p className="mt-1 whitespace-pre-line text-sm">{application.experience}</p>
              </div>
            </div>
            {application.additionalInfo && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Additional info</p>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)]">{application.additionalInfo}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <form action={approveInstructorApplicationAction}>
                <input type="hidden" name="id" value={application.id} />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} /> Approve as instructor
                </button>
              </form>
              <details className="group">
                <summary className="btn btn-ghost btn-sm cursor-pointer list-none text-[var(--danger)]">
                  <X size={14} /> Reject
                </summary>
                <form action={rejectInstructorApplicationAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={application.id} />
                  <input name="reviewNote" className="input h-9 text-xs sm:w-72" placeholder="Reason for rejection (optional)" />
                  <button type="submit" className="btn btn-sm text-[var(--danger)]">Confirm rejection</button>
                </form>
              </details>
            </div>
          </article>
        ))}
        {pending.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <ClipboardCheck size={24} className="mx-auto text-[var(--muted)]" />
            <h3 className="mt-3 text-sm font-semibold">No pending applications</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">New applications from the public form will appear here.</p>
            <Link href="/become-an-instructor" className="btn btn-sm mt-4">View public form</Link>
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="admin-card overflow-hidden">
          <div className="border-b border-[var(--line)] p-4">
            <h2 className="text-sm font-semibold">Reviewed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table admin-table min-w-[680px]">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Reviewed</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <p className="font-semibold">{application.fullName}</p>
                      <p className="text-[10px] text-[var(--muted)]">{application.email}</p>
                    </td>
                    <td>{application.courseTopic}</td>
                    <td>
                      <span className={`badge ${application.status === "approved" ? "badge-success" : "badge-danger"}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="text-[11px] text-[var(--muted)]">{formatDate(application.reviewedAt)}</td>
                    <td className="max-w-[260px] truncate text-[11px] text-[var(--muted)]">{application.reviewNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
