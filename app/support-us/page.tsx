import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, HeartHandshake, Megaphone, MessageSquare, Share2 } from "lucide-react";
import { InfoPage } from "@/components/info-page";
import { supportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Support Us",
  description:
    "Support practical tech education in Nigeria by sharing LearnHub, teaching, partnering with us or sending feedback.",
};

const ways = [
  {
    icon: Share2,
    title: "Share the platform",
    body: "Know someone who wants to break into tech? Send them a course that fits their goal.",
    href: "/courses",
    label: "Browse courses",
  },
  {
    icon: Megaphone,
    title: "Teach with us",
    body: "Turn your experience into a course and help learners build skills that employers need.",
    href: "/become-an-instructor",
    label: "Become an instructor",
  },
  {
    icon: Building2,
    title: "Partner with us",
    body: "Schools, employers and training organisations can work with us on programmes and hiring.",
    href: "/contact",
    label: "Start a conversation",
  },
  {
    icon: MessageSquare,
    title: "Send feedback",
    body: "Tell us what is working, what is missing and which courses we should add next.",
    href: "/contact",
    label: "Contact us",
  },
];

export default function SupportUsPage() {
  return (
    <InfoPage
      eyebrow="Support Us"
      title="Help more people learn."
      description="LearnHub grows through learners, instructors and partners who believe practical tech education should be affordable and accessible."
      icon={HeartHandshake}
      actions={[
        { href: "/contact", label: "Contact us", primary: true },
        { href: "/become-an-instructor", label: "Become an instructor" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {ways.map((way) => (
          <Link
            key={way.title}
            href={way.href}
            className="glass card-hover flex items-start gap-4 p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <way.icon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold">{way.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">{way.body}</span>
              <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                {way.label} <ArrowRight size={12} />
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="glass mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm font-semibold">Prefer email?</p>
        <a
          href={`mailto:${supportEmail}`}
          className="text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          {supportEmail}
        </a>
      </div>
    </InfoPage>
  );
}
