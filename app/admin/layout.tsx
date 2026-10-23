import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin-data";
import { paymentsProvider } from "@/lib/env";
import { fixtureCourses } from "@/lib/fixtures";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Your IT Class" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await requireAdmin();
  const localMode = current.id === "local-admin";

  if (localMode) {
    return (
      <AdminShell
        user={{ name: current.profile.fullName || "Local Admin", email: current.email, role: "super_admin" }}
        counts={{
          students: fixtureCourses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0),
          courses: fixtureCourses.length,
          drafts: fixtureCourses.filter((course) => !course.published).length,
          pending: 0,
          certificates: 0,
        }}
        paymentsMode="mock"
        localMode
      >
        {children}
      </AdminShell>
    );
  }

  const admin = await getAdminClient();
  const [{ count: studentCount }, { count: courseCount }, { count: draftCount }, { count: pendingCount }, { count: certificateCount }] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("courses").select("id", { count: "exact", head: true }),
      admin.from("courses").select("id", { count: "exact", head: true }).eq("published", false),
      admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("certificates").select("id", { count: "exact", head: true }),
    ]);

  return (
    <AdminShell
      user={{ name: current.profile.fullName || "Administrator", email: current.email, role: current.profile.role }}
      counts={{
        students: studentCount ?? 0,
        courses: courseCount ?? 0,
        drafts: draftCount ?? 0,
        pending: pendingCount ?? 0,
        certificates: certificateCount ?? 0,
      }}
      paymentsMode={paymentsProvider}
    >
      {children}
    </AdminShell>
  );
}
