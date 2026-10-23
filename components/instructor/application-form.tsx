"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitInstructorApplicationAction } from "@/app/become-an-instructor/actions";
import type { AdminActionState } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      {pending ? "Sending application…" : "Submit application"}
    </button>
  );
}

export function InstructorApplicationForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(submitInstructorApplicationAction, {});

  if (state.message) {
    return (
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] p-6 text-center">
        <CheckCircle2 size={30} className="mx-auto text-[var(--success)]" />
        <h2 className="mt-3 text-lg font-bold">Application received</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="fullName" className="label">Full name</label>
          <input id="fullName" name="fullName" className="input" defaultValue={defaultName} required />
        </div>
        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={defaultEmail} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="phone" className="label">Phone / WhatsApp</label>
          <input id="phone" name="phone" className="input" placeholder="+234…" required />
        </div>
        <div className="field">
          <label htmlFor="courseTopic" className="label">What do you want to teach?</label>
          <input id="courseTopic" name="courseTopic" className="input" placeholder="e.g. Frontend development" required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="experience" className="label">Your experience</label>
        <textarea
          id="experience"
          name="experience"
          className="textarea min-h-32"
          placeholder="Tell us about your professional experience, projects and any teaching or mentoring you have done."
          required
        />
      </div>

      <div className="field">
        <label htmlFor="additionalInfo" className="label">Anything else? (optional)</label>
        <textarea
          id="additionalInfo"
          name="additionalInfo"
          className="textarea min-h-20"
          placeholder="Links to your portfolio, social profiles or a course outline."
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-[var(--muted)]">
          Applications are reviewed manually. Approved instructors receive an email invitation to set up their studio.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
