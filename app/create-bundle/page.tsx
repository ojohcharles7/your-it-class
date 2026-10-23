import type { Metadata } from "next";
import { Banknote, Layers, PlusCircle, TrendingUp } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Create a Bundle",
  description:
    "Package your Your IT Class courses into a discounted bundle, guide learners through a full path and grow your earnings.",
};

const steps = [
  {
    icon: Layers,
    title: "Combine your courses",
    body: "Choose courses that build on each other and arrange them into a clear, guided learning path.",
  },
  {
    icon: Banknote,
    title: "Set the bundle price",
    body: "Offer the group at a discount so learners commit to the full path while you earn from every sale.",
  },
  {
    icon: TrendingUp,
    title: "Track performance",
    body: "Follow bundle enrolments, completions and earnings from your instructor studio.",
  },
];

export default function CreateBundlePage() {
  return (
    <InfoPage
      eyebrow="Create Bundle"
      title="Package your expertise."
      description="Turn your courses into a single guided path. Bundle creation is rolling out to instructors — apply to teach and we will help you package your first bundle."
      icon={PlusCircle}
      actions={[
        { href: "/become-an-instructor", label: "Apply to teach", primary: true },
        { href: "/instructor", label: "Instructor studio" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="glass p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white">
                <step.icon size={19} />
              </span>
              <span className="text-3xl font-bold tracking-tighter text-[color-mix(in_srgb,var(--ink)_8%,transparent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-4 text-base font-semibold">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
          </div>
        ))}
      </div>
    </InfoPage>
  );
}
