import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { FooterAdminMenu } from "@/components/footer-admin-menu";

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

const highlights = ["Video lessons", "Hands-on projects", "Verifiable certificates"];

const footerPalette = {
  "--surface": "rgba(255, 255, 255, 0.06)",
  "--surface-2": "rgba(13, 18, 30, 0.94)",
  "--surface-solid": "#0d1322",
  "--ink": "#f3f6fb",
  "--muted": "#9aa5ba",
  "--line": "rgba(255, 255, 255, 0.1)",
  "--line-strong": "rgba(255, 255, 255, 0.18)",
  "--accent": "#4da3ff",
  "--accent-2": "#8b7cff",
  "--success": "#34d399",
} as CSSProperties;

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 pb-8 pt-6 text-[var(--ink)]" style={footerPalette}>
      <div className="wrap-wide">
        <div
          className="relative rounded-[36px] p-px shadow-[var(--shadow)]"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--line) 45%, color-mix(in srgb, var(--accent-2) 50%, transparent))",
          }}
        >
          <div className="relative overflow-hidden rounded-[35px] border border-white/10 bg-[#070b14] backdrop-blur-2xl">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--accent-2)_20%,transparent)] blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px]"
              aria-hidden="true"
            />

            <div className="relative p-5 sm:p-8 lg:p-10">
              <div className="grid gap-10 lg:grid-cols-[1.15fr_2fr] lg:gap-14">
                <div className="max-w-sm">
                  <Logo onDark />
                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                    Practical, affordable IT education for Nigerian learners. Learn a skill, build real projects, and
                    get certified.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-solid)_55%,transparent)] px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <h2 className="mt-6 text-xl font-bold tracking-tight text-[var(--ink)]">Start learning today.</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/signup" className="btn btn-primary btn-sm">
                      Get started free <ArrowUpRight size={14} />
                    </Link>
                    <Link href="/courses" className="btn btn-sm">
                      Browse courses <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                  {columns.map((column) => (
                    <div key={column.title}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {column.title}
                      </p>
                      <div className="mt-4 flex flex-col gap-2.5 text-sm">
                        {column.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="group inline-flex w-fit items-center gap-1 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
                          >
                            {link.label}
                            <ArrowRight
                              size={12}
                              className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} LearnHub · Built by Charitech Concepts &amp; Services</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <FooterAdminMenu />
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
      </div>
    </footer>
  );
}
