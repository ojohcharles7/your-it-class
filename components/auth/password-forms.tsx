"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  requestPasswordResetAction,
  updatePasswordAction,
  type AuthState,
} from "@/app/actions/auth";

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]"
      >
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        {state.error}
      </div>
    );
  }

  if (state.message) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        {state.message}
      </div>
    );
  }

  return null;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordResetAction, {});

  return (
    <form action={action} className="mt-6 space-y-3.5">
      <Feedback state={state} />

      <div className="field">
        <label htmlFor="email" className="label">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        Send reset link
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePasswordAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 space-y-3.5">
      <Feedback state={state} />

      <div className="field">
        <label htmlFor="password" className="label">New password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="confirmPassword" className="label">Confirm new password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          className="input"
          placeholder="Repeat your new password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        Update password
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        <Link href="/forgot-password" className="font-semibold text-[var(--accent)] hover:underline">
          Request a new reset link
        </Link>
      </p>
    </form>
  );
}
