import type { Metadata } from "next";
import { InstructorShell } from "@/components/instructor/instructor-shell";
import { requireInstructor } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Instructor studio", template: "%s · Instructor · LearnHub" },
  robots: { index: false, follow: false },
};

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const current = await requireInstructor();

  return (
    <InstructorShell
      user={{
        name: current.profile.fullName || "Instructor",
        email: current.email,
        role: current.profile.role,
      }}
    >
      {children}
    </InstructorShell>
  );
}
