"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Crown,
  EllipsisVertical,
  FileText,
  HeartHandshake,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Megaphone,
  Package,
  PlusCircle,
  Search,
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

const exploreLinks = [
  { href: "/courses", label: "Courses", icon: BookOpen, description: "Browse every course in the catalogue" },
  {
    href: "/course-bundle",
    label: "Course Bundle",
    icon: Package,
    description: "Save more with grouped learning paths",
  },
  {
    href: "/create-bundle",
    label: "Create Bundle",
    icon: PlusCircle,
    description: "Package your courses for learners",
  },
  { href: "/premium", label: "Premium", icon: Crown, description: "Mentorship and career support" },
  {
    href: "/become-an-instructor",
    label: "Become an Instructor",
    icon: Megaphone,
    description: "Teach and earn on Your IT Class",
  },
  { href: "/contact", label: "Contact Us", icon: Mail, description: "Get help from our support team" },
  { href: "/blogs", label: "Blogs", icon: FileText, description: "Tutorials, guides and career advice" },
  { href: "/support-us", label: "Support Us", icon: HeartHandshake, description: "Help more people learn tech" },
  { href: "/about-us", label: "About Us", icon: Info, description: "Our mission and what we stand for" },
];

const mobileLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  ...exploreLinks,
];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const exploreRef = useRef<HTMLDivElement>(null);
  const accountHref = user
    ? isTeacherRole(user.role)
      ? "/instructor"
      : user.role === "super_admin"
        ? "/master"
        : user.role === "admin"
          ? "/admin"
          : "/dashboard"
    : "/dashboard";
  const exploreActive = pathname === "/explore" || exploreLinks.some((link) => pathname === link.href);

  useEffect(() => {
    setOpen(false);
    setExploreOpen(false);
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

  useEffect(() => {
    if (!exploreOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExploreOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exploreOpen]);

  function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setOpen(false);
    setExploreOpen(false);
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : "/courses");
  }

  return (
    <header className="no-print sticky top-3 z-50 mx-auto w-full max-w-[1680px] px-3 sm:px-5 lg:px-8">
      <nav className="glass-strong relative z-50 flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3">
        <Logo />

        <Link
          href="/"
          prefetch
          title="Home"
          aria-label="Home"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`ml-1 hidden h-10 w-10 place-items-center rounded-xl border transition-colors lg:grid ${
            pathname === "/"
              ? "border-[color-mix(in_srgb,var(--accent)_24%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[color-mix(in_srgb,var(--muted)_7%,transparent)] hover:text-[var(--ink)]"
          }`}
        >
          <Home size={17} />
        </Link>

        <div ref={exploreRef} className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setExploreOpen((value) => !value)}
            aria-expanded={exploreOpen}
            aria-haspopup="menu"
            aria-controls="explore-menu"
            className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              exploreOpen || exploreActive
                ? "border-[color-mix(in_srgb,var(--accent)_24%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[color-mix(in_srgb,var(--muted)_7%,transparent)] hover:text-[var(--ink)]"
            }`}
          >
            <Compass
              size={16}
              className={exploreOpen || exploreActive ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--accent)]"}
            />
            Explore
            <ChevronDown
              size={14}
              className={`text-[var(--muted)] transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {exploreOpen && (
            <div
              id="explore-menu"
              role="menu"
              aria-label="Explore"
              className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[600px]"
            >
              <span
                className="absolute -top-1.5 left-10 h-3 w-3 rotate-45 border-l border-t border-[var(--line)] bg-[var(--surface-solid)]"
                aria-hidden="true"
              />
              <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-solid)] shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface-solid))] px-4 py-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Explore</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Find a course, bundle or resource</p>
                  </div>
                  <Link
                    href="/explore"
                    prefetch
                    role="menuitem"
                    onClick={() => setExploreOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:border-[var(--line-strong)]"
                  >
                    Explore all <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-1 p-2">
                  {exploreLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch
                        role="menuitem"
                        onClick={() => setExploreOpen(false)}
                        className={`group flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                          active
                            ? "bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                            : "hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                            active
                              ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white"
                              : "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] group-hover:bg-gradient-to-br group-hover:from-[var(--accent)] group-hover:to-[var(--accent-2)] group-hover:text-white"
                          }`}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate text-sm font-semibold ${
                                active ? "text-[var(--ink)]" : "text-[var(--ink)]/90"
                              }`}
                            >
                              {link.label}
                            </span>
                            <ChevronRight
                              size={14}
                              className="shrink-0 -translate-x-1 text-[var(--accent)] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                            />
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted)]">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={runSearch}
          role="search"
          className="ml-1 hidden max-w-2xl flex-1 items-center gap-2 lg:flex"
        >
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a course"
              aria-label="Search for a course"
              className="input h-10 py-0 pl-9 pr-3 text-sm"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm h-10 px-4">
            Search
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
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
                <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Account</span>
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-ghost icon-btn" title="Log out" aria-label="Log out">
                  <LogOut size={16} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/signup" prefetch className="btn btn-primary btn-sm">
              <UserRoundPlus size={15} />
              Get Started
            </Link>
          )}
        </div>

        <div className="flex items-center lg:hidden">
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
            className="mobile-nav-backdrop fixed inset-0 z-40 cursor-default bg-[color-mix(in_srgb,var(--ink)_38%,transparent)] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            tabIndex={-1}
          />

          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="mobile-nav-panel absolute inset-x-3 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] p-3 shadow-2xl sm:inset-x-5 lg:hidden"
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

            <form onSubmit={runSearch} role="search" className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for a course"
                  aria-label="Search for a course"
                  className="input h-10 py-0 pl-9 pr-3 text-sm"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm h-10 px-4">
                Search
              </button>
            </form>

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
                  <UserRoundPlus size={15} /> Get Started
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
