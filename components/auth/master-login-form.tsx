"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { masterLoginAction, type AuthState } from "@/app/actions/auth";

export function MasterLoginForm({ email, configured }: { email: string; configured: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(masterLoginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 space-y-3.5">
      {!configured && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--warning)]">
          The master console needs Supabase. Add your project URL and anon key to{" "}
          <code className="font-mono">.env.local</code>, then restart the app.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      {state.message && (
        <div className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          {state.message}
        </div>
      )}

      <div className="field">
        <label htmlFor="master-email" className="label">
          Master email
        </label>
        <div className="relative">
          <ShieldCheck
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)]"
          />
          <input
            id="master-email"
            type="email"
            className="input cursor-not-allowed pl-9 opacity-80"
            value={email}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="master-password" className="label">
          Master password
        </label>
        <div className="relative">
          <LockKeyhole
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            id="master-password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input px-9"
            placeholder="Enter the master password"
            autoComplete="current-password"
            minLength={6}
            required
            autoFocus
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

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        {pending ? "Opening master console…" : "Enter master console"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
        Only the configured master email can use this page. Everyone else should{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          log in here
        </Link>
        .
      </p>
    </form>
  );
}
