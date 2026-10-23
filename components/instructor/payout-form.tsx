"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Send } from "lucide-react";
import { requestPayoutAction } from "@/app/instructor/actions";
import type { AdminActionState } from "@/lib/types";
import { naira } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      {pending ? "Submitting…" : "Request payout"}
    </button>
  );
}

export function PayoutForm({ availableKobo, hasBankDetails }: { availableKobo: number; hasBankDetails: boolean }) {
  const [state, action] = useActionState<AdminActionState, FormData>(requestPayoutAction, {});

  if (availableKobo <= 0) {
    return (
      <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed text-[var(--muted)]">
        You have no available balance yet. Earnings become available when a learner completes a successful course
        payment.
      </p>
    );
  }

  if (!hasBankDetails) {
    return (
      <p className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_9%,transparent)] p-4 text-xs leading-relaxed text-[var(--warning)]">
        Add your bank details in your instructor profile before requesting a payout.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.message && <p className="text-xs text-[var(--success)]">{state.message}</p>}
      <div>
        <label className="label">Amount (₦)</label>
        <input
          name="amountNaira"
          type="number"
          min={1}
          max={availableKobo / 100}
          step={100}
          className="input"
          placeholder={String(availableKobo / 100)}
          required
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">Available: {naira(availableKobo)}</p>
      </div>
      <div>
        <label className="label">Note for the master account (optional)</label>
        <textarea name="note" className="textarea min-h-20" placeholder="Any details about this payout request…" />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
