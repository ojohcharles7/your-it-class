import type { Metadata } from "next";
import { Code2, FileText, Lightbulb, ShieldCheck } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Tutorials, career advice and practical tech guides from the Your IT Class team are coming soon.",
};

const topics = [
  {
    icon: Code2,
    title: "Practical tutorials",
    body: "Step-by-step guides that complement our courses and help you apply what you learn.",
  },
  {
    icon: ShieldCheck,
    title: "Career & security",
    body: "Advice on breaking into tech, staying safe online and growing a lasting career.",
  },
  {
    icon: Lightbulb,
    title: "Learning tips",
    body: "Study routines, project ideas and exam strategies from instructors and successful learners.",
  },
];

export default function BlogsPage() {
  return (
    <InfoPage
      eyebrow="Blogs"
      title="Stories, guides and ideas."
      description="The Your IT Class blog is coming soon. Expect practical tutorials, career advice and behind-the-scenes lessons from our instructors."
      icon={FileText}
      actions={[
        { href: "/courses", label: "Browse courses", primary: true },
        { href: "/contact", label: "Suggest a topic" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <div key={topic.title} className="glass p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <topic.icon size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold">{topic.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{topic.body}</p>
          </div>
        ))}
      </div>
    </InfoPage>
  );
}
