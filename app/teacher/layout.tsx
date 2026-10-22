import type { Metadata } from "next";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Teaching desk", template: "%s · Teacher · Your IT Class" },
  robots: { index: false, follow: false },
};

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const current = await requireTeacher();

  return (
    <TeacherShell
      user={{
        name: current.profile.fullName || "Teacher",
        email: current.email,
        role: current.profile.role,
      }}
    >
      {children}
    </TeacherShell>
  );
}
