"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Trash2, UserRound } from "lucide-react";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
  type AccountState,
} from "@/app/actions/account";

function Feedback({ state }: { state: AccountState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]"
      >
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        {state.message}
      </p>
    );
  }

  return null;
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? <Loader2 size={15} className="animate-spin" /> : null}
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ProfileSettingsForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, {});

  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <UserRound size={18} className="text-[var(--accent)]" />
        <h2 className="text-base font-semibold">Profile</h2>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        This name appears on your reviews and certificates.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <Feedback state={state} />
        <div className="field">
          <label htmlFor="fullName" className="label">Full name</label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            defaultValue={fullName}
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </div>
        <Submit pending={pending} label="Save profile" />
      </form>
    </section>
  );
}

export function PasswordSettingsForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});

  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-[var(--accent)]" />
        <h2 className="text-base font-semibold">Password</h2>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Choose a password you don&apos;t use on other sites. Minimum 8 characters.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <Feedback state={state} />
        <div className="field">
          <label htmlFor="currentPassword" className="label">Current password</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="input"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="newPassword" className="label">New password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword" className="label">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>
        <Submit pending={pending} label="Change password" />
      </form>
    </section>
  );
}

export function DangerZone() {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAccountAction, {});

  return (
    <section className="glass border-[color-mix(in_srgb,var(--danger)_25%,transparent)] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[var(--danger)]">
        <Trash2 size={18} />
        <h2 className="text-base font-semibold">Delete account</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Permanently deletes your profile, enrolments, progress, certificates and payment records. This cannot be
        undone.
      </p>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--danger)]">
          I understand — show deletion form
        </summary>
        <form action={action} className="mt-3 space-y-3">
          <Feedback state={state} />
          <div className="field">
            <label htmlFor="password" className="label">Your password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmation" className="label">
              Type <span className="font-mono">DELETE</span> to confirm
            </label>
            <input
              id="confirmation"
              name="confirmation"
              className="input font-mono"
              autoComplete="off"
              placeholder="DELETE"
              required
            />
          </div>
          <button type="submit" className="btn btn-danger" disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {pending ? "Deleting…" : "Delete my account permanently"}
          </button>
        </form>
      </details>
    </section>
  );
}
