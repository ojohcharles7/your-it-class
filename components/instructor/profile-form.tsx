"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import { saveInstructorProfileAction } from "@/app/instructor/actions";
import type { AdminActionState, InstructorProfile } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

export function InstructorProfileForm({
  profile,
  fallbackName,
  fallbackSlug,
}: {
  profile: InstructorProfile | null;
  fallbackName: string;
  fallbackSlug: string;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(saveInstructorProfileAction, {});
  const [fullName, setFullName] = useState(profile?.fullName || fallbackName);
  const [slug, setSlug] = useState(profile?.slug || fallbackSlug);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="field">
          <label htmlFor="fullName" className="label">Full name</label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              if (!profile) {
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                );
              }
            }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="slug" className="label">Public profile URL</label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--muted)]">/instructors/</span>
            <input
              id="slug"
              name="slug"
              className="input font-mono text-xs"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
              required
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="headline" className="label">Headline</label>
        <input
          id="headline"
          name="headline"
          className="input"
          defaultValue={profile?.headline}
          placeholder="e.g. Full-stack developer and mentor"
          maxLength={140}
        />
      </div>

      <div className="field">
        <label htmlFor="bio" className="label">Bio</label>
        <textarea
          id="bio"
          name="bio"
          className="textarea min-h-32"
          defaultValue={profile?.bio}
          placeholder="Tell learners about your experience, teaching style and what they will build."
          maxLength={3000}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="field">
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" name="phone" className="input" defaultValue={profile?.phone} placeholder="+234…" />
        </div>
        <div className="field">
          <label htmlFor="website" className="label">Website / portfolio</label>
          <input id="website" name="website" type="url" className="input" defaultValue={profile?.website} placeholder="https://…" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="avatarUrl" className="label">Avatar URL</label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          className="input"
          defaultValue={profile?.avatarUrl ?? ""}
          placeholder="https://…"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">Paste a public image URL. Upload support can be added later.</p>
      </div>

      <div className="field">
        <label htmlFor="expertise" className="label">Expertise</label>
        <input
          id="expertise"
          name="expertise"
          className="input"
          defaultValue={profile?.expertise.join(", ")}
          placeholder="Web development, React, APIs"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">Separate skills with commas.</p>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--line)] p-3 text-sm">
        <input
          type="checkbox"
          name="isPublic"
          defaultChecked={profile?.isPublic ?? true}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Show my profile and published courses publicly
      </label>

      <div className="rounded-2xl border border-[var(--line)] p-4">
        <h2 className="text-sm font-semibold">Payout bank details</h2>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
          These details are used for payout requests and are only visible to you and an admin.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="field mb-0">
            <label htmlFor="bankName" className="label">Bank name</label>
            <input id="bankName" name="bankName" className="input" defaultValue={profile?.bankName} />
          </div>
          <div className="field mb-0">
            <label htmlFor="accountName" className="label">Account name</label>
            <input id="accountName" name="accountName" className="input" defaultValue={profile?.accountName} />
          </div>
          <div className="field mb-0">
            <label htmlFor="accountNumber" className="label">Account number</label>
            <input
              id="accountNumber"
              name="accountNumber"
              inputMode="numeric"
              className="input"
              defaultValue={profile?.accountNumber}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--muted)]">
          Revenue share: <strong className="text-[var(--ink)]">{profile?.revenueSharePercent ?? 60}%</strong> of gross course sales.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
