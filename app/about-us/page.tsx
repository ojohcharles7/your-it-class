import type { Metadata } from "next";
import { BadgeCheck, HeartHandshake, Target, Wallet } from "lucide-react";
import { InfoPage } from "@/components/info-page";
import { getCourses } from "@/lib/data";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "LearnHub is a Nigerian learning platform built to make practical, affordable tech education accessible to everyone.",
};

const values = [
  {
    icon: Target,
    title: "Practical first",
    body: "Every course is built around skills you can use immediately, not theory you forget after the exam.",
  },
  {
    icon: Wallet,
    title: "Affordable access",
    body: "Courses are priced in Naira for Nigerian learners, with a free preview lesson in every course.",
  },
  {
    icon: BadgeCheck,
    title: "Proof of skill",
    body: "Timed exams and verifiable certificates let learners show employers exactly what they have mastered.",
  },
  {
    icon: HeartHandshake,
    title: "Built with support",
    body: "We are a small team that answers questions, reviews applications and keeps improving the experience.",
  },
];

export const revalidate = 300;

export default async function AboutUsPage() {
  const courses = await getCourses();
  const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0);

  return (
    <InfoPage
      eyebrow="About Us"
      title="Practical tech education, built for Nigeria."
      description="LearnHub is an online learning platform operated by Charitech Concepts & Services. We help learners go from curious beginner to confident, certified practitioner."
      icon={HeartHandshake}
      actions={[
        { href: "/courses", label: "Browse courses", primary: true },
        { href: "/contact", label: "Contact us" },
      ]}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: `${courses.length}`, label: "Career paths" },
          { value: `${totalStudents.toLocaleString()}+`, label: "Learners" },
          { value: "100%", label: "Online" },
          { value: "24/7", label: "Access" },
        ].map((stat) => (
          <div key={stat.label} className="glass px-4 py-5 text-center">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {values.map((value) => (
          <div key={value.title} className="glass p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <value.icon size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold">{value.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{value.body}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-4 p-6">
        <h2 className="text-base font-semibold">Our mission</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
          We believe a good tech education should be practical, affordable and provable. That is why every course
          combines video lessons, hands-on projects, a final exam and a certificate anyone can verify online.
        </p>
      </div>
    </InfoPage>
  );
}
