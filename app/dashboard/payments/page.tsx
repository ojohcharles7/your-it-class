import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPayments } from "@/lib/data";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const current = await requireUser("/dashboard/payments");
  const payments = await getPayments(current.id);
  const total = payments.filter((payment) => payment.status === "success").reduce((sum, payment) => sum + payment.amountKobo, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Billing</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Every course is a one-time payment. No subscriptions.</p>
        </div>
        <div className="glass px-4 py-2.5 text-right">
          <p className="text-[11px] text-[var(--muted)]">Total invested</p>
          <p className="text-lg font-bold">{naira(total)}</p>
        </div>
      </div>

      {payments.length ? (
        <div className="table-wrap glass">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="font-medium">{payment.courseTitle ?? "Course"}</td>
                  <td className="text-[var(--muted)]">{formatDate(payment.createdAt)}</td>
                  <td className="font-mono text-[11px] text-[var(--muted)]">{payment.reference}</td>
                  <td className="font-semibold">{naira(payment.amountKobo)}</td>
                  <td>
                    <span className={`badge ${
                      payment.status === "success" ? "badge-success" : payment.status === "pending" ? "badge-warning" : "badge-muted"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <CreditCard size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No payments yet</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Your receipts will appear here after your first enrolment.</p>
          <Link href="/courses" className="btn btn-primary mt-4">Browse courses</Link>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <ExternalLink size={13} /> Payments are processed securely by Paystack in Nigerian Naira.
      </p>
    </div>
  );
}
