import type { Metadata } from "next";
import { MasterShell } from "@/components/master/master-shell";
import { requireSuperAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin-data";

export const metadata: Metadata = {
  title: { default: "Master", template: "%s · Master · Your IT Class" },
  robots: { index: false, follow: false },
};

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const localMode = current.id === "local-admin";

  let counts = { applications: 0, approvals: 0, payouts: 0 };

  if (!localMode) {
    const admin = await getAdminClient();
    const [{ count: applications }, { count: approvals }, { count: payouts }] = await Promise.all([
      admin.from("instructor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("courses").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
      admin.from("payout_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    counts = { applications: applications ?? 0, approvals: approvals ?? 0, payouts: payouts ?? 0 };
  }

  return (
    <MasterShell
      user={{ name: current.profile.fullName || "Master", email: current.email, role: current.profile.role }}
      counts={counts}
      localMode={localMode}
    >
      {children}
    </MasterShell>
  );
}
