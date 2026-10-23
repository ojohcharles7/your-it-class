import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, BookOpen, Megaphone, Users } from "lucide-react";
import { InstructorApplicationForm } from "@/components/instructor/application-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Become an Instructor",
  description:
    "Teach on Your IT Class. Share your skills, reach motivated learners and earn a share of every course sale.",
};
export const dynamic = "force-dynamic";

const benefits = [
  {
    icon: Users,
    title: "Reach motivated learners",
    body: "Your courses sit alongside a focused catalog of practical technology programs.",
  },
  {
    icon: BadgeCheck,
    title: "Keep creative control",
    body: "Build lessons, handouts and exams in your own studio. We review before the first publish.",
  },
  {
    icon: Banknote,
    title: "Earn from every sale",
    body: "Receive 60% of gross course sales, tracked automatically in your earnings ledger.",
  },
  {
    icon: BookOpen,
    title: "A real teaching studio",
    body: "Video lessons, downloadable resources, assessments and student insights in one place.",
  },
];

const steps = [
  { title: "Apply", body: "Tell us what you teach and a little about your experience." },
  { title: "Get approved", body: "The master reviewer checks your application and creates your studio." },
  { title: "Build your course", body: "Add lessons, resources and an exam, then submit it for review." },
  { title: "Publish & earn", body: "Once approved, your course goes live and earnings start tracking." },
];

export default async function BecomeInstructorPage() {
  const current = await getCurrentUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
        <div>
          <span className="badge badge-accent">
            <Megaphone size={11} /> Instructor applications open
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Teach what you know.
            <span className="block bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              Get paid for it.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)]">
            Your IT Class is building a catalog of practical technology courses. If you can teach it well, we want to
            help you package it, publish it and earn from it.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="admin-card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                  <benefit.icon size={16} />
                </span>
                <h2 className="mt-3 text-sm font-semibold">{benefit.title}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{benefit.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold">How it works</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-[11px] text-[var(--muted)]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/instructors" className="btn btn-sm">
              Meet our instructors <ArrowRight size={13} />
            </Link>
            <Link href="/courses" className="btn btn-ghost btn-sm">Browse courses</Link>
          </div>
        </div>

        <div className="admin-card p-5 sm:p-6 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold tracking-tight">Apply to teach</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Takes a few minutes. We review applications manually and reply by email.
          </p>
          <div className="mt-5">
            <InstructorApplicationForm
              defaultName={current?.profile.fullName ?? ""}
              defaultEmail={current?.email ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
