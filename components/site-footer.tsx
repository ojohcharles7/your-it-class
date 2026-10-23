import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 py-10">
      <div className="wrap-wide">
        <div className="flex flex-col gap-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Practical, affordable IT education for Nigerian learners. Learn a skill, build real projects, and get
              certified.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Learn</p>
              <div className="flex flex-col gap-2">
                <Link href="/courses" className="hover:text-[var(--accent)]">All courses</Link>
                <Link href="/instructors" className="hover:text-[var(--accent)]">Instructors</Link>
                <Link href="/become-an-instructor" className="hover:text-[var(--accent)]">Become an instructor</Link>
                <Link href="/#why" className="hover:text-[var(--accent)]">Why us</Link>
                <Link href="/#faq" className="hover:text-[var(--accent)]">FAQ</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Account</p>
              <div className="flex flex-col gap-2">
                <Link href="/login" className="hover:text-[var(--accent)]">Log in</Link>
                <Link href="/signup" className="hover:text-[var(--accent)]">Create account</Link>
                <Link href="/dashboard" className="hover:text-[var(--accent)]">Dashboard</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Company</p>
              <div className="flex flex-col gap-2">
                <Link href="/verify" className="hover:text-[var(--accent)]">Check a certificate</Link>
                <Link href="/contact" className="hover:text-[var(--accent)]">Contact support</Link>
                <Link href="/terms" className="hover:text-[var(--accent)]">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-[var(--accent)]">Privacy Policy</Link>
                <Link href="/refunds" className="hover:text-[var(--accent)]">Refund Policy</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="divider" />
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-[var(--muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} Your IT Class · Built by Charitech Concepts &amp; Services</p>
          <p>Learn tech skills that pay.</p>
        </div>
        </div>
      </div>
    </footer>
  );
}
