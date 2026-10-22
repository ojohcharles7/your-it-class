import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Your IT Class dashboard to continue learning.",
};

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; auth?: string }>;
}) {
  const { next, auth } = await searchParams;
  const target = safeNext(next);
  const current = await getCurrentUser();
  if (current) redirect(target);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Welcome back</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Log in to continue</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Pick up where you left off and keep your streak going.</p>

      {auth === "link_invalid" && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--warning)]"
        >
          That link is invalid or has expired. Request a new password reset link and try again.
        </div>
      )}
      {auth === "not_configured" && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--warning)]"
        >
          Accounts are not connected yet. Add your Supabase keys to <code className="font-mono">.env.local</code>.
        </div>
      )}

      <AuthForm mode="login" next={target} configured={isSupabaseConfigured} />
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Platform owner?{" "}
        <Link href="/masteruser" className="font-semibold text-[var(--accent)] hover:underline">
          Master login
        </Link>
      </p>
    </div>
  );
}
