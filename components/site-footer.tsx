import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/explore", label: "Explore" },
      { href: "/courses", label: "All courses" },
      { href: "/course-bundle", label: "Course bundle" },
      { href: "/premium", label: "Premium" },
      { href: "/blogs", label: "Blogs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about-us", label: "About us" },
      { href: "/contact", label: "Contact us" },
      { href: "/support-us", label: "Support us" },
      { href: "/become-an-instructor", label: "Become an instructor" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/verify", label: "Verify a certificate" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refunds", label: "Refund Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 pb-8 pt-6">
      <div className="wrap-wide">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_88%,transparent)] shadow-[var(--shadow)] backdrop-blur-2xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_55%,transparent)] to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--accent-2)_18%,transparent)] blur-3xl"
            aria-hidden="true"
          />

          <div className="relative p-5 sm:p-7 lg:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <Sparkles size={11} className="text-[var(--accent)]" />
                Learning, beautifully simple
              </span>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_2fr] lg:gap-14">
              <div className="max-w-sm">
                <Logo />
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                  Practical, affordable IT education for Nigerian learners. Learn a skill, build real projects, and get
                  certified.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/courses" className="btn btn-primary btn-sm">
                    Start learning <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/become-an-instructor" className="btn btn-sm">
                    Teach with us
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {columns.map((column) => (
                  <div key={column.title}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {column.title}
                    </p>
                    <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
                      {column.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="w-fit text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Your IT Class · Built by Charitech Concepts &amp; Services</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                  All systems operational
                </span>
                <span className="hidden h-3 w-px bg-[var(--line)] sm:inline-block" aria-hidden="true" />
                <span>Made with care in Nigeria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
