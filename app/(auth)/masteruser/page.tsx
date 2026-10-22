import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { MasterLoginForm } from "@/components/auth/master-login-form";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured, masterAdminEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Master login",
  description: "Private sign-in for the Your IT Class master administrator.",
  robots: { index: false, follow: false },
};

export default async function MasterUserPage() {
  const current = await getCurrentUser();
  if (current) {
    if (current.profile.role === "super_admin") redirect("/master");
    if (current.profile.role === "admin") redirect("/admin");
    if (current.profile.role === "teacher") redirect("/teacher");
    redirect("/dashboard");
  }

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
      >
        <ArrowLeft size={14} /> Back to website
      </Link>
      <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
        <ShieldCheck size={13} /> Master access
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Master sign in</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        This entrance is reserved for the platform owner. Sign in to manage teachers, roles and every account from the
        admin console.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--muted)]">
        <KeyRound size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <span>
          Master email: <strong className="text-[var(--ink)]">{masterAdminEmail}</strong>. The password is the master
          password you set for this account. After signing in you will land on your private{" "}
          <code className="font-mono">/master</code> console.
        </span>
      </div>

      <MasterLoginForm email={masterAdminEmail} configured={isSupabaseConfigured} />

      <p className="mt-3 text-center text-xs">
        <Link href="/forgot-password" className="font-semibold text-[var(--accent)] hover:underline">
          Forgot master password?
        </Link>
      </p>

      <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
        Are you a student or teacher?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          Use the normal login
        </Link>
      </p>
    </div>
  );
}
