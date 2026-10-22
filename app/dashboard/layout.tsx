import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard · Your IT Class" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await requireUser();

  return (
    <DashboardShell
      user={{
        name: current.profile.fullName || "Student",
        email: current.email,
        role: current.profile.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
