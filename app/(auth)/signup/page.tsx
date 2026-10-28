import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free LearnHub account and start learning practical tech skills.",
};

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  const current = await getCurrentUser();
  if (current) redirect(target);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Get started free</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Join learners building practical tech skills. No card needed to create an account.
      </p>
      <AuthForm mode="signup" next={target} configured={isSupabaseConfigured} />
      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--muted)]">
        By creating an account you agree to use the platform responsibly. Course purchases are one-time payments.
      </p>
    </div>
  );
}
