import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="wrap max-w-3xl py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={14} /> Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-[var(--muted)]">Last updated: {updated}</p>
      <p className="mt-5 text-sm leading-relaxed text-[var(--ink)]">{intro}</p>
      <div
        className="mt-6 space-y-5 text-sm leading-relaxed text-[var(--muted)] [&_a]:font-semibold [&_a]:text-[var(--accent)] [&_a:hover]:underline [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--ink)] [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
      >
        {children}
      </div>
      <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
        Questions about this policy? <Link href="/contact" className="font-semibold text-[var(--accent)] hover:underline">Contact support</Link>.
      </div>
    </main>
  );
}
