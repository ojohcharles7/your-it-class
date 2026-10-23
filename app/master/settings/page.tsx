import type { Metadata } from "next";
import { Percent, Settings, ShieldCheck } from "lucide-react";
import { savePlatformSettingsAction } from "@/app/master/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin-data";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function MasterSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";

  let defaultShare = 60;
  if (!localMode && isSupabaseConfigured) {
    const admin = await getAdminClient();
    const { data } = await admin.from("platform_settings").select("value").eq("key", "instructor_default_share").maybeSingle();
    if (data?.value) defaultShare = Number(data.value);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Platform settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Defaults and guardrails for the instructor marketplace.</p>
      </div>

      {params.ok && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          {params.ok}
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {params.error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="admin-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Percent size={17} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold">Instructor default share</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            This is the default percentage of gross course sales paid to instructors. Existing instructor shares are
            unchanged; edit individual instructors from the Instructors page.
          </p>
          <form action={savePlatformSettingsAction} className="mt-5 flex flex-wrap items-end gap-3">
            <div className="field mb-0 w-40">
              <label htmlFor="instructorDefaultShare" className="label">Default share %</label>
              <input
                id="instructorDefaultShare"
                name="instructorDefaultShare"
                type="number"
                min={0}
                max={100}
                step={1}
                defaultValue={defaultShare}
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Save settings</button>
          </form>
        </section>

        <aside className="admin-card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
            <ShieldCheck size={18} />
          </span>
          <h2 className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
            <Settings size={14} /> How it works
          </h2>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[var(--muted)]">
            <li>Instructor earnings are recorded automatically from successful course payments.</li>
            <li>Changing an instructor share only affects future earnings, never past ledger entries.</li>
            <li>Payouts reserve the requested amount from the instructor&apos;s available balance.</li>
            <li>Marking a payout paid is final; record the real transfer reference.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
