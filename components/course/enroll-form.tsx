"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, BadgeCheck, Clock3, Loader2, LockKeyhole, Upload } from "lucide-react";
import { startEnrollment, type EnrollmentState } from "@/app/actions/enrollment";
import { naira } from "@/lib/utils";
import type { ManualPaymentDetails, PaymentSubmission } from "@/lib/types";

export function EnrollForm({
  courseId,
  slug,
  priceKobo,
  loggedIn,
  details,
  submission,
  referralCode,
}: {
  courseId: string;
  slug: string;
  priceKobo: number;
  loggedIn: boolean;
  details: ManualPaymentDetails;
  submission: PaymentSubmission | null;
  referralCode: string;
}) {
  const [state, action, pending] = useActionState<EnrollmentState, FormData>(startEnrollment, {});

  if (!loggedIn) {
    return (
      <Link href={`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn btn-primary btn-lg w-full">
        Create account to enrol <ArrowRight size={16} />
      </Link>
    );
  }

  if (submission?.status === "pending") {
    return (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--warning)]">
          <Clock3 size={16} /> Payment under review
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
          We received your transfer proof on {new Date(submission.createdAt).toLocaleDateString("en-NG")}. An admin
          will verify it and unlock the course.
        </p>
        <Link href="/dashboard/payments" className="btn btn-sm mt-3 w-full">
          View payment status
        </Link>
      </div>
    );
  }

  const rejected = submission?.status === "rejected";

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="referralCode" value={referralCode} />

      {rejected && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-xs leading-relaxed text-[var(--danger)]">
          <p className="font-semibold">Your last proof was rejected.</p>
          {submission.reviewNote && <p className="mt-1">{submission.reviewNote}</p>}
          <p className="mt-1">Check the transfer details and upload a new receipt below.</p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 text-xs">
        {details.bankName || details.accountNumber ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Transfer to</p>
            <p className="mt-1.5 text-sm font-semibold">{details.bankName || "Bank not set"}</p>
            <p className="mt-0.5 font-mono text-base font-bold tracking-wider">{details.accountNumber || "—"}</p>
            <p className="mt-0.5 text-[var(--muted)]">{details.accountName || "Account name not set"}</p>
            {details.instructions && (
              <p className="mt-2 leading-relaxed text-[var(--muted)]">{details.instructions}</p>
            )}
          </>
        ) : (
          <p className="leading-relaxed text-[var(--muted)]">
            Bank details have not been published yet. Contact support before sending money.
          </p>
        )}
      </div>

      <div className="field mb-0">
        <label htmlFor="payerName" className="label">Name on the transfer</label>
        <input id="payerName" name="payerName" className="input" required minLength={2} maxLength={120} placeholder="e.g. Ada Obi" />
      </div>

      <div className="field mb-0">
        <label htmlFor="bankReference" className="label">Bank reference / session ID</label>
        <input id="bankReference" name="bankReference" className="input" required minLength={2} maxLength={120} placeholder="From your bank receipt" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="field mb-0">
          <label htmlFor="payerPhone" className="label">Phone (optional)</label>
          <input id="payerPhone" name="payerPhone" className="input" maxLength={40} placeholder="080…" />
        </div>
        <div className="field mb-0">
          <label htmlFor="couponCode" className="label">Coupon (optional)</label>
          <input id="couponCode" name="couponCode" className="input uppercase" maxLength={40} placeholder="CODE" />
        </div>
      </div>

      <div className="field mb-0">
        <label htmlFor="proof" className="label">Payment receipt</label>
        <label
          htmlFor="proof"
          className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]"
        >
          <Upload size={16} className="shrink-0 text-[var(--accent)]" />
          <span>JPG, PNG, WebP or PDF · max 10 MB</span>
        </label>
        <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="sr-only" />
      </div>

      <div className="field mb-0">
        <label htmlFor="note" className="label">Note (optional)</label>
        <textarea id="note" name="note" className="input min-h-16" maxLength={1000} placeholder="Anything we should know?" />
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Submitting proof…
          </>
        ) : (
          <>
            I have paid {naira(priceKobo)} <ArrowRight size={16} />
          </>
        )}
      </button>

      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-xs leading-relaxed text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[var(--muted)]">
        <LockKeyhole size={12} />
        Manual bank transfer · access after admin approval
      </p>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
        <BadgeCheck size={12} />
        Coupon discounts are verified before approval
      </p>
    </form>
  );
}
