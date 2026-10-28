import type { Metadata } from "next";
import { Briefcase, Crown, Sparkles, Users } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "LearnHub Premium is coming soon with mentorship, exclusive workshops and career resources for serious learners.",
};

const perks = [
  {
    icon: Users,
    title: "Mentor access",
    body: "Get guidance from practising professionals when you are stuck or planning your next career move.",
  },
  {
    icon: Sparkles,
    title: "Exclusive workshops",
    body: "Join live sessions and deep dives that go beyond the standard course curriculum.",
  },
  {
    icon: Briefcase,
    title: "Career resources",
    body: "CV reviews, portfolio feedback and interview preparation built for the Nigerian tech market.",
  },
];

export default function PremiumPage() {
  return (
    <InfoPage
      eyebrow="Premium"
      title="Go further with Premium."
      description="Premium is on the way. It will add mentorship, live workshops and career support on top of your courses — while every standard course stays exactly as it is."
      icon={Crown}
      actions={[
        { href: "/signup", label: "Create free account", primary: true },
        { href: "/courses", label: "Browse courses" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {perks.map((perk) => (
          <div key={perk.title} className="glass p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <perk.icon size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold">{perk.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{perk.body}</p>
          </div>
        ))}
      </div>
      <div className="glass mt-6 p-6 text-center">
        <p className="text-sm font-semibold">Premium is launching soon</p>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--muted)]">
          Create your free account today and you will be notified as soon as Premium opens.
        </p>
      </div>
    </InfoPage>
  );
}
