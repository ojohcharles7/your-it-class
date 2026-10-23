"use client";

import Link from "next/link";
import { IntentLink } from "@/components/ui/intent-link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Clapperboard,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

const nav = [
  { href: "/teacher", label: "Overview", icon: LayoutDashboard },
  { href: "/teacher/studio", label: "Course studio", icon: Clapperboard },
  { href: "/teacher/students", label: "My students", icon: Users },
];

const shortcuts = [
  { href: "/dashboard", label: "Dashboard", icon: GraduationCap },
  { href: "/", label: "Home", icon: Home },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return href === "/teacher" ? pathname === "/teacher" : pathname.startsWith(href);
}

export function TeacherShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = [...nav, ...shortcuts].find((item) => isActive(pathname, item.href));

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
        <Link href="/teacher" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600 text-white shadow-lg shadow-emerald-500/25">
            <Zap size={19} strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-extrabold uppercase tracking-[0.16em] text-white">
              Your IT Class
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Teaching desk
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

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Teaching</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <IntentLink key={item.href} href={item.href} className="admin-nav-link" data-active={isActive(pathname, item.href)}>
              <item.icon size={17} />
              {item.label}
            </IntentLink>
          ))}
        </nav>

        <p className="px-2.5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Shortcuts</p>
        <nav className="space-y-1">
          {shortcuts.map((item) => (
            <IntentLink key={item.href} href={item.href} className="admin-nav-link">
              <item.icon size={17} />
              {item.label}
            </IntentLink>
          ))}
        </nav>
      </div>

      <div className="mx-3 mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Sparkles size={14} className="text-emerald-300" />
          Teacher access
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          Create classes, upload lesson videos, and see every learner who paid for your classes.
        </p>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-bold text-white">
            {initials(user.name || "Teacher")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name || "Teacher"}</p>
            <p className="truncate text-[10px] text-slate-400">{user.email}</p>
          </div>
          <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
            Teacher
          </span>
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
    <div className="admin-canvas min-h-screen">
      <aside
        className="admin-sidebar fixed inset-y-0 left-0 z-50 w-[272px] -translate-x-full transition-transform duration-300 data-[open=true]:translate-x-0 lg:translate-x-0"
        data-open={mobileOpen}
      >
        {sidebar}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <div className="lg:pl-[272px]">
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Link href="/teacher" className="font-medium hover:text-[var(--ink)]">Teaching desk</Link>
              {current && current.href !== "/teacher" && (
                <>
                  <span>/</span>
                  <span className="font-semibold text-[var(--ink)]">{current.label}</span>
                </>
              )}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/"
                title="Home"
                aria-label="Home"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <Home size={16} />
              </Link>
              <ThemeToggle />
              <Link href="/dashboard" className="btn btn-sm hidden sm:inline-flex">
                <GraduationCap size={14} /> Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
