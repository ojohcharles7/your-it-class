"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, signupAction, type AuthState } from "@/app/actions/auth";

export function AuthForm({
  mode,
  next,
  configured,
}: {
  mode: "login" | "signup";
  next: string;
  configured: boolean;
}) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(signup ? signupAction : loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 space-y-3.5">
      <input type="hidden" name="next" value={next} />

      {!configured && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--warning)]">
          Accounts need Supabase. Add your project URL and anon key to <code className="font-mono">.env.local</code>,
          run the SQL in <code className="font-mono">supabase/migrations</code>, then restart the dev server.
        </div>
      )}

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]">
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

      {signup && (
        <div className="field">
          <label htmlFor="fullName" className="label">Full name</label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            placeholder="e.g. Amina Bello"
            autoComplete="name"
            required
          />
        </div>
      )}

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

      <div className="field">
        <label htmlFor="password" className="label">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            placeholder="At least 6 characters"
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={6}
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

      {!signup && (
        <p className="text-right text-xs">
          <Link href="/forgot-password" className="font-semibold text-[var(--accent)] hover:underline">
            Forgot password?
          </Link>
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        {signup ? "Create my account" : "Log in to dashboard"}
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        {signup ? "Already have an account?" : "New to LearnHub?"}{" "}
        <Link
          href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          {signup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
