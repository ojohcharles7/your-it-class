import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { DangerZone, PasswordSettingsForm, ProfileSettingsForm } from "@/components/dashboard/settings-forms";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await requireUser("/dashboard/settings");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Your account</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update your details, secure your password and manage your data.
        </p>
      </div>

      <section className="glass flex flex-wrap items-center gap-3 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-sm font-bold text-white">
          {current.profile.fullName?.slice(0, 2).toUpperCase() || "YI"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{current.profile.fullName || "Student"}</p>
          <p className="truncate text-xs text-[var(--muted)]">{current.email}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge badge-accent">
            <BadgeCheck size={11} /> {roleLabel(current.profile.role)}
          </span>
          <span className="badge badge-muted">Joined {formatDate(current.profile.createdAt)}</span>
        </div>
      </section>

      <ProfileSettingsForm fullName={current.profile.fullName} />
      <PasswordSettingsForm />

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Need a copy of your data or have a privacy question? See our{" "}
        <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">Privacy Policy</Link> or{" "}
        <Link href="/contact" className="font-semibold text-[var(--accent)] hover:underline">contact support</Link>.
      </p>

      <DangerZone />
    </div>
  );
}
