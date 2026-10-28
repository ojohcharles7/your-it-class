"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck, UserCog, X } from "lucide-react";
import { loginAction, masterLoginAction, type AuthState } from "@/app/actions/auth";

type Mode = "admin" | "master";

export function FooterAdminMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("admin");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Staff login"
              className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-solid)] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                    <ShieldCheck size={12} /> Staff access
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight">Sign in to your console</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close login"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-[var(--ink)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] p-1">
                  <button
                    type="button"
                    onClick={() => setMode("admin")}
                    data-active={mode === "admin"}
                    className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] transition data-[active=true]:bg-[var(--surface-solid)] data-[active=true]:text-[var(--ink)] data-[active=true]:shadow-sm"
                  >
                    <ShieldCheck size={14} /> Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("master")}
                    data-active={mode === "master"}
                    className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] transition data-[active=true]:bg-[var(--surface-solid)] data-[active=true]:text-[var(--ink)] data-[active=true]:shadow-sm"
                  >
                    <UserCog size={14} /> Master user
                  </button>
                </div>

                <div className="mt-5">
                  {mode === "admin" ? <AdminLoginForm /> : <MasterLoginForm />}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Staff login"
        aria-haspopup="dialog"
        title="Staff login"
        className="group -m-1.5 grid h-5 w-5 place-items-center rounded-full"
      >
        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)] transition group-hover:scale-150" />
      </button>
      {modal}
    </>
  );
}

function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value="/admin" />

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="footer-admin-email" className="label">Admin email</label>
        <div className="relative">
          <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="footer-admin-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            className="input pl-9"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="footer-admin-password" className="label">Password</label>
        <div className="relative">
          <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="footer-admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            className="input pl-9"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {pending ? "Signing in…" : "Log in to admin"}
      </button>
    </form>
  );
}

function MasterLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(masterLoginAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="footer-master-email" className="label">Master email</label>
        <div className="relative">
          <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="footer-master-email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue="ojohcharles7@gmail.com"
            placeholder="master@example.com"
            className="input pl-9"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="footer-master-password" className="label">Password</label>
        <div className="relative">
          <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="footer-master-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Master password"
            className="input pl-9"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {pending ? "Signing in…" : "Log in as master user"}
      </button>
    </form>
  );
}
