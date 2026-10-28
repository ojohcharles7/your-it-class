import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your LearnHub account.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Enter the email address on your account and we&apos;ll send you a secure link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
