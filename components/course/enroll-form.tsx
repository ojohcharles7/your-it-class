"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { startEnrollment, type EnrollmentState } from "@/app/actions/enrollment";
import { naira } from "@/lib/utils";

export function EnrollForm({
  courseId,
  slug,
  priceKobo,
  loggedIn,
  mock,
}: {
  courseId: string;
  slug: string;
  priceKobo: number;
  loggedIn: boolean;
  mock: boolean;
}) {
  const [state, action, pending] = useActionState<EnrollmentState, FormData>(startEnrollment, {});

  if (!loggedIn) {
    return (
      <Link href={`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn btn-primary btn-lg w-full">
        Create account to enrol <ArrowRight size={16} />
      </Link>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Processing…
          </>
        ) : (
          <>
            Enrol for {naira(priceKobo)} <ArrowRight size={16} />
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
        {mock ? "Test mode · no real charge" : "Secure checkout via Paystack · Instant access"}
      </p>
    </form>
  );
}
