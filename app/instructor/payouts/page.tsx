import type { Metadata } from "next";
import Link from "next/link";
import { Award, Landmark, Wallet } from "lucide-react";
import { PayoutForm } from "@/components/instructor/payout-form";
import { requireInstructor } from "@/lib/auth";
import {
  getInstructorAvailableBalance,
  getInstructorPayouts,
  getInstructorProfile,
} from "@/lib/data";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

const badgeFor = (status: string) => {
  if (status === "paid") return "badge-success";
  if (status === "approved") return "badge-accent";
  if (status === "rejected") return "badge-danger";
  return "badge-warning";
};

export default async function InstructorPayoutsPage() {
  const current = await requireInstructor();
  const [profile, balance, payouts] = await Promise.all([
    getInstructorProfile(current.id),
    getInstructorAvailableBalance(current.id),
    getInstructorPayouts(current.id),
  ]);

  const hasBankDetails = Boolean(profile?.bankName && profile?.accountName && profile?.accountNumber);
  const paid = payouts.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amountKobo, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Studio</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Payouts</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Request a withdrawal of your available earnings. An admin reviews every payout.
          </p>
        </div>
        <Link href="/instructor/profile" className="btn btn-sm self-start sm:self-auto">
          <Landmark size={14} /> Bank details
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Available", value: naira(balance), icon: Wallet },
          { label: "Paid out", value: naira(paid), icon: Award },
          { label: "Requests", value: payouts.length, icon: Landmark },
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-start">
        <section className="admin-card p-5">
          <h2 className="text-base font-semibold">Request a payout</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Payouts are sent to the bank account saved in your instructor profile.
          </p>
          {profile && (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs">
              <p className="font-semibold">{profile.bankName || "No bank saved"}</p>
              <p className="mt-0.5 text-[var(--muted)]">
                {profile.accountName || "Add an account name"} · {profile.accountNumber || "Add an account number"}
              </p>
            </div>
          )}
          <div className="mt-4">
            <PayoutForm availableKobo={balance} hasBankDetails={hasBankDetails} />
          </div>
        </section>

        <section className="admin-card overflow-hidden">
          <div className="border-b border-[var(--line)] p-4">
            <h2 className="text-sm font-semibold">Payout history</h2>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">Pending requests reserve part of your available balance.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table admin-table min-w-[620px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="text-[11px] text-[var(--muted)]">{formatDate(payout.createdAt)}</td>
                    <td className="font-semibold">{naira(payout.amountKobo)}</td>
                    <td><span className={`badge ${badgeFor(payout.status)}`}>{payout.status}</span></td>
                    <td className="text-[11px] text-[var(--muted)]">{payout.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payouts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Landmark size={22} className="mx-auto text-[var(--muted)]" />
              <p className="mt-2 text-sm font-semibold">No payout requests yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Your requests and their status will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
