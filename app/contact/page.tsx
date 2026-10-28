import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, HelpCircle, Mail, ShieldCheck } from "lucide-react";
import { supportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "Get help with your LearnHub account, payments, courses or certificates.",
};

const topics = [
  {
    icon: CreditCard,
    title: "Payments & enrolments",
    body: "Charged but not unlocked, or not sure which course to buy? Send us the Paystack reference from your payments page.",
    href: "/dashboard/payments",
    label: "View your payments",
  },
  {
    icon: ShieldCheck,
    title: "Certificates & verification",
    body: "Employers can verify a certificate serial on the public verification page. Issues with a certificate? Contact us.",
    href: "/verify",
    label: "Verify a certificate",
  },
  {
    icon: HelpCircle,
    title: "Courses & exams",
    body: "Questions about a lesson, the final exam or your progress? Check the course dashboard first, then reach out.",
    href: "/courses",
    label: "Browse courses",
  },
];

export default function ContactPage() {
  return (
    <main className="wrap max-w-4xl py-12">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Support</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How can we help?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
        We&apos;re a small team supporting learners across Nigeria. Email is the fastest way to reach us and we aim to
        reply within two business days.
      </p>

      <a
        href={`mailto:${supportEmail}`}
        className="glass mt-6 flex flex-wrap items-center gap-3 p-5 transition-colors hover:border-[var(--line-strong)]"
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <Mail size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Email support</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{supportEmail}</p>
        </div>
        <ArrowRight size={17} className="text-[var(--muted)]" />
      </a>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <section key={topic.title} className="glass flex flex-col p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <topic.icon size={17} />
            </span>
            <h2 className="mt-3 text-sm font-semibold">{topic.title}</h2>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--muted)]">{topic.body}</p>
            <Link href={topic.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline">
              {topic.label} <ArrowRight size={12} />
            </Link>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-xs leading-relaxed text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">Before you email</p>
        <p className="mt-1">
          Include your account email, the course name and any Paystack reference. Never send your password or full
          card details. Read our <Link href="/terms" className="font-semibold text-[var(--accent)] hover:underline">Terms</Link>,{" "}
          <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">Privacy Policy</Link>{" "}
          and <Link href="/refunds" className="font-semibold text-[var(--accent)] hover:underline">Refund Policy</Link>.
        </p>
      </div>
    </main>
  );
}
