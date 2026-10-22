"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { localAdminLoginAction, type LocalAdminState } from "@/app/actions/local-admin";

export function LocalLoginForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState<LocalAdminState, FormData>(localAdminLoginAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="admin-email" className="label">Admin email</label>
        <div className="relative">
          <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={defaultEmail}
            className="input pl-9"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="admin-password" className="label">Password</label>
        <div className="relative">
          <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Local admin password"
            className="input pl-9"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {pending ? "Opening control center…" : "Enter local admin"}
      </button>
    </form>
  );
}
