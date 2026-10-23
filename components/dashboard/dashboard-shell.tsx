"use client";

import Link from "next/link";
import { IntentLink } from "@/components/ui/intent-link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronRight,
  Compass,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Presentation,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { isAdminRole, isTeacherRole, roleLabel } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

type ShellUser = { name: string; email: string; role: Role };

const learningNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My courses", icon: BookOpen },
  { href: "/dashboard/exams", label: "Exams", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/settings", label: "Profile & settings", icon: Settings },
];

const exploreNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Browse courses", icon: Compass },
  { href: "/verify", label: "Verify a certificate", icon: ShieldCheck },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function sectionFor(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  const match = learningNav.find((item) => item.href !== "/dashboard" && pathname.startsWith(item.href));
  return match?.label ?? "Dashboard";
}

export function DashboardShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = sectionFor(pathname);
  const firstName = user.name.split(/\s+/)[0] || "Student";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30">
            <GraduationCap size={20} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-extrabold uppercase tracking-[0.16em] text-white">
              Your IT Class
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Learning desk
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Learning</p>
        <nav className="space-y-1">
          {learningNav.map((item) => (
            <IntentLink key={item.href} href={item.href} className="admin-nav-link" data-active={isActive(pathname, item.href)}>
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
            </IntentLink>
          ))}
        </nav>

        <p className="px-2.5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Explore</p>
        <nav className="space-y-1">
          {exploreNav.map((item) => (
            <IntentLink key={item.href} href={item.href} className="admin-nav-link" data-active={isActive(pathname, item.href)}>
              <item.icon size={17} />
              {item.label}
            </IntentLink>
          ))}
          {isTeacherRole(user.role) && (
            <IntentLink href="/instructor" className="admin-nav-link" data-active={pathname.startsWith("/instructor")}>
              <Presentation size={17} />
              Instructor studio
            </IntentLink>
          )}
          {user.role === "super_admin" ? (
            <IntentLink href="/master" className="admin-nav-link" data-active={pathname.startsWith("/master")}>
              <ShieldCheck size={17} />
              Master console
            </IntentLink>
          ) : isAdminRole(user.role) ? (
            <IntentLink href="/admin" className="admin-nav-link" data-active={pathname.startsWith("/admin")}>
              <ShieldCheck size={17} />
              Admin panel
            </IntentLink>
          ) : null}
        </nav>
      </div>

      <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
        <p className="text-xs font-semibold text-white">Keep going, {firstName}.</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          Every completed lesson moves you closer to a verifiable certificate.
        </p>
        <Link href="/courses" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:text-sky-200">
          Find another course <ChevronRight size={12} />
        </Link>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 text-[11px] font-bold text-white">
            {initials(user.name || "Student")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name || "Student"}</p>
            <p className="truncate text-[10px] text-slate-400">{user.email}</p>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{roleLabel(user.role)}</span>
        </div>
        <form action={signOutAction} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-canvas min-h-dvh">
      <aside
        className="admin-sidebar fixed inset-y-0 left-0 z-50 w-[272px] -translate-x-full transition-transform duration-300 data-[open=true]:translate-x-0 lg:translate-x-0"
        data-open={mobileOpen}
      >
        {sidebar}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="min-w-0 lg:pl-[272px]">
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--ink)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <nav className="hidden items-center gap-1.5 text-xs sm:flex" aria-label="Breadcrumb">
              <Link href="/dashboard" className="font-medium text-[var(--muted)] hover:text-[var(--ink)]">
                Dashboard
              </Link>
              <span className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-[var(--muted)]" />
                <span className="font-semibold text-[var(--ink)]">{section}</span>
              </span>
            </nav>

            <span className="ml-1 text-sm font-semibold sm:hidden">{section}</span>

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/"
                title="Home"
                aria-label="Home"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <Home size={16} />
              </Link>

              <Link
                href="/courses"
                className="hidden items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)] md:flex"
              >
                <Compass size={14} /> Browse courses
              </Link>

              <ThemeToggle className="hidden sm:inline-flex" />

              <Link
                href="/"
                target="_blank"
                className="hidden h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] sm:flex"
              >
                <ExternalLink size={14} /> View site
              </Link>

              <Link
                href="/dashboard/settings"
                className="ml-1 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] p-1 pr-2.5 transition hover:border-[var(--line-strong)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                  {initials(user.name || "Student")}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block text-[11px] font-semibold leading-tight">{firstName}</span>
                  <span className="block text-[9px] uppercase tracking-wide text-[var(--muted)]">
                    {roleLabel(user.role)}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-[11px] text-[var(--muted)] sm:px-6 lg:px-8">
          <span>Your IT Class · Learning desk</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Progress saved to your account
          </span>
        </footer>
      </div>
    </div>
  );
}
