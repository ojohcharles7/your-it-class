import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, BarChart3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { LocalLoginForm } from "@/components/admin/local-login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  getLocalAdminSession,
  localAdminEmail,
  localAdminEnabled,
  localAdminPassword,
  localAdminUsingDefaults,
} from "@/lib/local-admin";

export const metadata: Metadata = {
  title: "Local admin login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LocalAdminLoginPage() {
  if (!localAdminEnabled) redirect("/login?next=/admin");
  const session = await getLocalAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#080e1b] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
            <Zap size={19} strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-[13px] font-extrabold uppercase tracking-[0.16em]">LearnHub</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Control center</span>
          </span>
        </Link>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300">
            <Sparkles size={13} className="text-amber-300" />
            Local preview mode
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight xl:text-5xl">
            Explore the admin experience before you connect Supabase.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Log in locally to preview the dashboard, catalogue and control-center layout with sample data.
            Nothing is written to a database, and no credentials are needed yet.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: BarChart3, text: "Revenue, learner and completion analytics" },
              { icon: ShieldCheck, text: "Course, lesson, exam and certificate management views" },
              { icon: BadgeCheck, text: "Switch to Supabase auth automatically once configured" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-sky-300">
                  <item.icon size={15} />
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-500">
          Local admin access is disabled automatically when Supabase environment keys are present.
        </p>
      </section>

      <section className="admin-canvas flex min-h-screen flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
            <ArrowLeft size={14} /> Back to website
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--accent)]">
                <Sparkles size={13} /> Local preview mode
              </span>
            </div>

            <div className="admin-card p-6 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck size={22} />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Local admin login</h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                Preview the control center now. Connect Supabase later for live data.
              </p>

              <div className="mt-6">
                <LocalLoginForm defaultEmail={localAdminEmail} />
              </div>

              {localAdminUsingDefaults && (
                <div className="mt-5 rounded-xl border border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-3.5 text-xs leading-relaxed text-[var(--muted)]">
                  <p className="font-semibold text-[var(--ink)]">Default local credentials</p>
                  <p className="mt-1 font-mono text-[11px]">{localAdminEmail}</p>
                  <p className="font-mono text-[11px]">{localAdminPassword}</p>
                  <p className="mt-2">
                    Change these with <code className="font-mono">LOCAL_ADMIN_EMAIL</code> and{" "}
                    <code className="font-mono">LOCAL_ADMIN_PASSWORD</code> in <code className="font-mono">.env.local</code>.
                  </p>
                </div>
              )}

              <p className="mt-5 text-[11px] leading-relaxed text-[var(--muted)]">
                Local mode uses sample catalogue data and read-only management views. Adding your Supabase keys
                switches the admin to real authentication and live records.
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] text-[var(--muted)]">
              Already connected Supabase? <Link href="/login?next=/admin" className="font-semibold text-[var(--accent)] hover:underline">Use the regular login</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
