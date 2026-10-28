import type { Metadata } from "next";
import { BadgeCheck, CreditCard, Layers, Package } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Course Bundles",
  description:
    "Combine related LearnHub courses into one discounted learning path and earn a certificate for every course.",
};

const benefits = [
  {
    icon: Layers,
    title: "One guided path",
    body: "Related courses are grouped in the right order, so you build skills without guessing what comes next.",
  },
  {
    icon: CreditCard,
    title: "One lower price",
    body: "Pay once for the whole bundle instead of buying each course separately and keep the savings.",
  },
  {
    icon: BadgeCheck,
    title: "Every certificate",
    body: "Complete each course in the bundle and earn a verifiable certificate for every skill you master.",
  },
];

export default function CourseBundlePage() {
  return (
    <InfoPage
      eyebrow="Course Bundle"
      title="Bundle courses. Save more."
      description="Course bundles combine related courses into a single learning path at a lower price. We are putting the final touches on our first bundles — browse the catalogue in the meantime."
      icon={Package}
      actions={[
        { href: "/courses", label: "Browse courses", primary: true },
        { href: "/contact", label: "Ask about bundles" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="glass p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <benefit.icon size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold">{benefit.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{benefit.body}</p>
          </div>
        ))}
      </div>
      <div className="glass mt-6 p-6 text-center">
        <p className="text-sm font-semibold">Bundles are launching soon</p>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--muted)]">
          Want to be first to know when bundles go live? Reach out and tell us which courses you would like to see
          bundled together.
        </p>
      </div>
    </InfoPage>
  );
}
