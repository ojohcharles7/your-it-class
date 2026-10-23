import type { Metadata } from "next";
import { Check, Landmark, Send, Wallet, X } from "lucide-react";
import { reviewPayoutAction } from "@/app/master/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getPayoutRequests } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

const badgeFor = (status: string) => {
  if (status === "paid") return "badge-success";
  if (status === "approved") return "badge-accent";
  if (status === "rejected") return "badge-danger";
  return "badge-warning";
};

export default async function MasterPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";
  const payouts = !localMode && isSupabaseConfigured ? await getPayoutRequests() : [];
  const open = payouts.filter((row) => row.status === "pending" || row.status === "approved");
  const done = payouts.filter((row) => row.status === "paid" || row.status === "rejected");
  const openValue = open.reduce((sum, row) => sum + row.amountKobo, 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Payouts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Review requests, record the bank transfer reference and mark payouts as paid.
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
          { label: "Open requests", value: open.length },
          { label: "Open value", value: naira(openValue) },
          { label: "Paid", value: naira(payouts.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amountKobo, 0)) },
          { label: "All requests", value: payouts.length },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <Wallet size={16} />
            </span>
            <p className="mt-3 text-lg font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Requests to settle</h2>
        {open.map((payout) => (
          <article key={payout.id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{payout.instructorName || "Instructor"}</h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Requested {formatDate(payout.createdAt)}</p>
                {payout.note && <p className="mt-2 text-xs text-[var(--muted)]">Note: {payout.note}</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{naira(payout.amountKobo)}</p>
                <span className={`badge ${badgeFor(payout.status)}`}>{payout.status}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Bank</p>
                <p className="mt-1 font-semibold">{payout.bankName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Account name</p>
                <p className="mt-1 font-semibold">{payout.accountName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Account number</p>
                <p className="mt-1 font-mono font-semibold">{payout.accountNumber}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {payout.status === "pending" && (
                <form action={reviewPayoutAction}>
                  <input type="hidden" name="id" value={payout.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Check size={14} /> Approve request
                  </button>
                </form>
              )}
              <details className="group">
                <summary className="btn btn-ghost btn-sm cursor-pointer list-none">
                  <Send size={14} /> Mark paid
                </summary>
                <form action={reviewPayoutAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={payout.id} />
                  <input type="hidden" name="decision" value="paid" />
                  <input name="reference" className="input h-9 text-xs sm:w-56" placeholder="Transfer reference" required />
                  <input name="reviewNote" className="input h-9 text-xs sm:w-56" placeholder="Optional note" />
                  <button type="submit" className="btn btn-sm">Confirm paid</button>
                </form>
              </details>
              <details className="group">
                <summary className="btn btn-ghost btn-sm cursor-pointer list-none text-[var(--danger)]">
                  <X size={14} /> Reject
                </summary>
                <form action={reviewPayoutAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={payout.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input name="reviewNote" className="input h-9 text-xs sm:w-72" placeholder="Reason" required />
                  <button type="submit" className="btn btn-sm text-[var(--danger)]">Confirm rejection</button>
                </form>
              </details>
            </div>
          </article>
        ))}
        {open.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <Landmark size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">No open payout requests</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Instructor payout requests will appear here.</p>
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="admin-card overflow-hidden">
          <div className="border-b border-[var(--line)] p-4">
            <h2 className="text-sm font-semibold">Settled payouts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table admin-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {done.map((payout) => (
                  <tr key={payout.id}>
                    <td className="font-medium">{payout.instructorName || "Instructor"}</td>
                    <td className="font-semibold">{naira(payout.amountKobo)}</td>
                    <td><span className={`badge ${badgeFor(payout.status)}`}>{payout.status}</span></td>
                    <td className="text-[11px] text-[var(--muted)]">{payout.reference || "—"}</td>
                    <td className="text-[11px] text-[var(--muted)]">{formatDate(payout.paidAt || payout.reviewedAt)}</td>
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
