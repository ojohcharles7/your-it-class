import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, CreditCard, ExternalLink, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPaymentSubmissions, getPayments } from "@/lib/data";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

const submissionBadge = (status: string) => {
  if (status === "approved") return "badge-success";
  if (status === "rejected") return "badge-danger";
  return "badge-warning";
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const current = await requireUser("/dashboard/payments");
  const [payments, submissions, params] = await Promise.all([
    getPayments(current.id),
    getPaymentSubmissions(current.id),
    searchParams,
  ]);
  const total = payments.filter((payment) => payment.status === "success").reduce((sum, payment) => sum + payment.amountKobo, 0);
  const pending = submissions.filter((submission) => submission.status === "pending");

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

      {params.submitted && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          Payment proof submitted. We will review it and unlock your course.
        </p>
      )}

      {pending.length > 0 && (
        <section className="glass p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 size={16} className="text-[var(--warning)]" /> Waiting for approval
          </h2>
          <div className="mt-3 space-y-2">
            {pending.map((submission) => (
              <div key={submission.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <div>
                  <p className="text-sm font-medium">{submission.courseTitle ?? "Course"}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Ref {submission.bankReference} · {formatDate(submission.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{naira(submission.amountKobo)}</p>
                  <span className="badge badge-warning">pending</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="table-wrap glass">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-sm font-semibold">Transfer proofs</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">Uploaded receipts and their review status.</p>
        </div>
        {submissions.length ? (
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Course</th>
                <th>Submitted</th>
                <th>Bank reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="font-medium">{submission.courseTitle ?? "Course"}</td>
                  <td className="text-[var(--muted)]">{formatDate(submission.createdAt)}</td>
                  <td className="font-mono text-[11px] text-[var(--muted)]">{submission.bankReference}</td>
                  <td className="font-semibold">{naira(submission.amountKobo)}</td>
                  <td>
                    <span className={`badge ${submissionBadge(submission.status)}`}>{submission.status}</span>
                    {submission.status === "rejected" && submission.reviewNote && (
                      <p className="mt-1 max-w-[240px] text-[10px] leading-relaxed text-[var(--danger)]">{submission.reviewNote}</p>
                    )}
                  </td>
                  <td>
                    {submission.status === "rejected" && submission.courseSlug ? (
                      <Link href={`/courses/${submission.courseSlug}`} className="btn btn-sm">
                        Try again
                      </Link>
                    ) : submission.status === "approved" && submission.courseSlug ? (
                      <Link href={`/dashboard/courses/${submission.courseSlug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                        Open course <ExternalLink size={12} />
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <CreditCard size={22} />
            </span>
            <p className="mt-3 text-sm font-semibold">No transfer proofs yet</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Your receipts will appear here after you enrol in a course.</p>
            <Link href="/courses" className="btn btn-primary mt-4">Browse courses</Link>
          </div>
        )}
      </section>

      <section className="table-wrap glass">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-sm font-semibold">Receipts</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">Approved and historical transactions.</p>
        </div>
        {payments.length ? (
          <table className="table min-w-[680px]">
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
        ) : (
          <div className="p-8 text-center text-sm text-[var(--muted)]">No approved transactions yet.</div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> Approved transfers unlock instantly</span>
        <span className="inline-flex items-center gap-1.5"><XCircle size={13} /> Rejected proofs can be replaced</span>
      </div>
    </div>
  );
}
