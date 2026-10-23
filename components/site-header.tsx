"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  EllipsisVertical,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOutAction } from "@/app/actions/auth";
import { isTeacherRole } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

type HeaderUser = {
  name: string;
  email: string;
  role: Role;
};

const links = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/instructors", label: "Instructors", icon: Sparkles },
  { href: "/become-an-instructor", label: "Teach", icon: CircleHelp },
  { href: "/#faq", label: "FAQ", icon: CircleHelp },
];

const mobileLinks = [{ href: "/", label: "Home", icon: Home }, ...links];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const accountHref = user
    ? isTeacherRole(user.role)
      ? "/instructor"
      : user.role === "super_admin"
        ? "/master"
        : user.role === "admin"
          ? "/admin"
          : "/dashboard"
    : "/dashboard";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="no-print sticky top-3 z-50 mx-auto w-full max-w-[1680px] px-3 sm:px-5 lg:px-8">
      <nav className="glass-strong relative z-50 flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3">
        <Logo />

        <div className="ml-auto hidden items-center gap-1.5 md:flex">
          <Link
            href="/"
            prefetch
            className={`btn btn-ghost icon-btn ${pathname === "/" ? "text-[var(--ink)]" : ""}`}
            title="Home"
            aria-label="Home"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <Home size={17} />
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <span className="mx-1 h-5 w-px bg-[var(--line)]" aria-hidden="true" />
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href={accountHref}
                prefetch
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-solid)] p-1 pr-3 transition hover:border-[var(--line-strong)]"
                title="My account"
                aria-label="My account"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">Account</span>
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-ghost icon-btn" title="Log out" aria-label="Log out">
                  <LogOut size={16} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" prefetch className="btn btn-ghost btn-sm">
                <LogIn size={15} />
                Log in
              </Link>
              <Link href="/signup" prefetch className="btn btn-primary btn-sm">
                <UserRoundPlus size={15} />
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center md:hidden">
          <button
            type="button"
            className="btn icon-btn"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
          >
            <EllipsisVertical size={20} />
          </button>
        </div>
      </nav>

      {open && (
        <>
          <button
            type="button"
            className="mobile-nav-backdrop fixed inset-0 z-40 cursor-default bg-[color-mix(in_srgb,var(--ink)_38%,transparent)] md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            tabIndex={-1}
          />

          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="mobile-nav-panel absolute inset-x-3 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] p-3 shadow-2xl sm:inset-x-5 md:hidden"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Menu</p>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] hover:text-[var(--ink)]"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              {mobileLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] hover:text-[var(--ink)]"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <ChevronRight
                      size={15}
                      className="text-[var(--muted)] transition group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              })}
            </div>

            <div className="my-3 h-px bg-[var(--line)]" />

            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-[color-mix(in_srgb,var(--muted)_6%,transparent)] px-3 py-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  </div>
                </div>
                <Link href={accountHref} prefetch className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                  <LayoutDashboard size={15} /> My account
                </Link>
                <form action={signOutAction}>
                  <button type="submit" className="btn w-full">
                    <LogOut size={15} /> Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link href="/login" prefetch className="btn w-full" onClick={() => setOpen(false)}>
                  <LogIn size={15} /> Log in
                </Link>
                <Link href="/signup" prefetch className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                  <UserRoundPlus size={15} /> Get started
                </Link>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2">
              <div>
                <p className="text-xs font-semibold">Appearance</p>
                <p className="text-[10px] text-[var(--muted)]">Switch light or dark</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </header>
  );
}
