"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, X } from "lucide-react";
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

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/courses", label: "Courses" },
    { href: "/#why", label: "Why us" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="no-print sticky top-3 z-50 mx-auto w-full max-w-[1680px] px-3 sm:px-5 lg:px-8">
      <nav className="glass-strong flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3">
        <Logo />

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <>
              <Link
                href={isTeacherRole(user.role) ? "/teacher" : "/dashboard"}
                className="btn btn-primary icon-btn"
                title={isTeacherRole(user.role) ? "Teaching desk" : "Dashboard"}
                aria-label={isTeacherRole(user.role) ? "Teaching desk" : "Dashboard"}
              >
                <LayoutDashboard size={16} />
              </Link>
              <span
                className="hidden h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white sm:grid"
                title={user.name}
              >
                {initials(user.name)}
              </span>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-ghost icon-btn" title="Log out" aria-label="Log out">
                  <LogOut size={16} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost icon-btn" title="Log in" aria-label="Log in">
                <LogIn size={16} />
              </Link>
              <Link href="/signup" className="btn btn-primary icon-btn" title="Get started" aria-label="Get started">
                <UserPlus size={16} />
              </Link>
            </>
          )}
          <button
            type="button"
            className="btn icon-btn md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass-strong mt-2 rounded-2xl p-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] hover:text-[var(--ink)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="divider my-2" />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2 pb-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={isTeacherRole(user.role) ? "/teacher" : "/dashboard"}
                  className="btn btn-primary"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard size={15} /> {isTeacherRole(user.role) ? "Teaching desk" : "Dashboard"}
                </Link>
                <form action={signOutAction} className="mt-1">
                  <button type="submit" className="btn w-full">
                    <LogOut size={15} /> Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="btn" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Get started <ArrowRight size={15} />
                </Link>
              </>
            )}
            <div className="mt-2 flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
