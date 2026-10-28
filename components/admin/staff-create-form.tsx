"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { createStaffAccountAction } from "@/app/admin/actions";
import type { AdminActionState } from "@/lib/types";

export function StaffCreateForm() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createStaffAccountAction, {});

  return (
    <form action={action} className="space-y-3">
      {state.error && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="label">Full name</span>
          <input name="fullName" className="input" placeholder="e.g. Charles Ojoh" required />
        </label>
        <label className="field">
          <span className="label">Email</span>
          <input name="email" type="email" className="input" placeholder="user@example.com" required />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="label">Temporary password</span>
          <input name="password" type="text" className="input" placeholder="At least 6 characters" minLength={6} required />
        </label>
        <label className="field">
          <span className="label">Role</span>
          <select name="role" className="select" defaultValue="master">
            <option value="master">Master user</option>
            <option value="admin">Admin</option>
            <option value="teacher">Instructor</option>
          </select>
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
        {pending ? "Creating account…" : "Create staff account"}
      </button>
    </form>
  );
}
