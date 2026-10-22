import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Account recovery</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Reset link required</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          This page only works after opening the reset link we emailed you. Links expire after a short time and can
          only be used once.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Request a new link
          </Link>
          <Link href="/login" className="btn w-full">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Signing in as <span className="font-semibold text-[var(--ink)]">{current.email}</span>. Your new password
        must be at least 8 characters.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
