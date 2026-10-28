import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin-data";
import { fixtureCourses } from "@/lib/fixtures";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · LearnHub" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await requireAdmin();
  const localMode = current.id === "local-admin";

  if (localMode) {
    return (
      <AdminShell
        user={{ name: current.profile.fullName || "Local Admin", email: current.email, role: "admin" }}
        counts={{
          students: fixtureCourses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0),
          courses: fixtureCourses.length,
          drafts: fixtureCourses.filter((course) => !course.published).length,
        }}
        localMode
      >
        {children}
      </AdminShell>
    );
  }

  const admin = await getAdminClient();
  const [{ count: studentCount }, { count: courseCount }, { count: draftCount }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("courses").select("id", { count: "exact", head: true }),
    admin.from("courses").select("id", { count: "exact", head: true }).eq("published", false),
  ]);

  return (
    <AdminShell
      user={{ name: current.profile.fullName || "Administrator", email: current.email, role: current.profile.role }}
      counts={{
        students: studentCount ?? 0,
        courses: courseCount ?? 0,
        drafts: draftCount ?? 0,
      }}
    >
      {children}
    </AdminShell>
  );
}
