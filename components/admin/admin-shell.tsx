"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  CloudOff,
  Command,
  ExternalLink,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Link } from "@/components/console-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { roleLabel } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

type Counts = {
  students: number;
  courses: number;
  drafts: number;
};

type AdminShellProps = {
  user: { name: string; email: string; role: Role };
  counts: Counts;
  localMode?: boolean;
  children: React.ReactNode;
};

const workspaceNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/courses/new", label: "Add course", icon: Plus },
  { href: "/admin/content", label: "Class content", icon: FolderOpen },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Instructors", icon: UserCog },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/courses") {
    return pathname === "/admin/courses" || /^\/admin\/courses\/(?!new$)[^/]+$/.test(pathname);
  }
  return pathname.startsWith(href);
}

function breadcrumbFor(pathname: string) {
  const path = pathname;
  if (path === "/admin") return [{ label: "Overview", href: "/admin" }];
  if (path === "/admin/courses/new") {
    return [
      { label: "Courses", href: "/admin/courses" },
      { label: "New course", href: path },
    ];
  }
  if (/^\/admin\/courses\/[^/]+$/.test(path)) {
    return [
      { label: "Courses", href: "/admin/courses" },
      { label: "Edit course", href: path },
    ];
  }
  const match = workspaceNav.find((item) => item.href !== "/admin" && path.startsWith(item.href));
  return match ? [{ label: match.label, href: match.href }] : [{ label: "Console", href: "/admin" }];
}

export function AdminShell({ user, counts, localMode = false, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const paletteInput = useRef<HTMLInputElement>(null);
  const consoleLabel = "Admin";
  const breadcrumb = breadcrumbFor(pathname);
  const firstName = user.name.split(/\s+/)[0] || "Admin";
  const visibleNav = workspaceNav;

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setPaletteOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      window.setTimeout(() => paletteInput.current?.focus(), 30);
    }
  }, [paletteOpen]);

  useEffect(() => {
    const locked = mobileOpen || paletteOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, paletteOpen]);

  const paletteItems = [
    ...visibleNav.map((item) => ({ ...item, group: "Pages" })),
    { href: "/admin/courses/new", label: "Create a new course", icon: Plus, group: "Actions" },
  ].filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(query.toLowerCase()));

  const countsFor = (href: string) => {
    if (href === "/admin/students") return counts.students;
    if (href === "/admin/courses") return counts.courses;
    return null;
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30">
            <Zap size={19} strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-extrabold uppercase tracking-[0.16em] text-white">
              LearnHub
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Control center
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

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="mx-4 mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-slate-200"
      >
        <Search size={14} />
        <span className="flex-1">Quick jump…</span>
        <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">⌘K</kbd>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <nav className="space-y-1">
          {visibleNav.map((item) => {
            const active = isActive(pathname, item.href);
            const count = countsFor(item.href);
            return (
              <Link key={item.href} href={item.href} className="admin-nav-link" data-active={active}>
                <item.icon size={17} />
                <span className="flex-1">{item.label}</span>
                {count !== null && count > 0 && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-200">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

      </div>

      <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
        {localMode ? (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <CloudOff size={14} className="text-amber-300" />
              Local preview
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              You are exploring the control center with sample data. Add Supabase keys to switch to live records.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Read-only demo
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles size={14} className="text-amber-300" />
              Manual payments
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Review bank-transfer proofs and approve enrolments from the payments page.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
              Database connected
            </div>
          </>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 text-[11px] font-bold text-white">
            {initials(user.name || "Admin")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name || "Administrator"}</p>
            <p className="truncate text-[10px] text-slate-400">{user.email}</p>
          </div>
          <span className="grid h-7 w-7 place-items-center rounded-lg text-emerald-300" title={roleLabel(user.role)}>
            <ShieldCheck size={15} />
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
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-50 w-[272px] -translate-x-full transition-transform duration-300 data-[open=true]:translate-x-0 lg:translate-x-0" data-open={mobileOpen}>
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
              <Link href="/admin" className="font-medium text-[var(--muted)] hover:text-[var(--ink)]">{consoleLabel}</Link>
              {breadcrumb.map((item, index) => (
                <span key={item.href} className="flex items-center gap-1.5">
                  <ChevronRight size={13} className="text-[var(--muted)]" />
                  {index === breadcrumb.length - 1 ? (
                    <span className="font-semibold text-[var(--ink)]">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="font-medium text-[var(--muted)] hover:text-[var(--ink)]">{item.label}</Link>
                  )}
                </span>
              ))}
            </nav>

            <span className="ml-1 text-sm font-semibold sm:hidden">{consoleLabel}</span>

            {localMode && (
              <span className="ml-2 hidden items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--warning)] md:inline-flex">
                <CloudOff size={11} /> Local preview
              </span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)] md:flex"
              >
                <Search size={14} />
                Search admin
                <kbd className="ml-2 rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--muted)] hover:text-[var(--ink)] md:hidden"
                aria-label="Search admin"
              >
                <Search size={16} />
              </button>

              <Link
                href="/"
                title="Home"
                aria-label="Home"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <Home size={16} />
              </Link>

              <ThemeToggle className="hidden sm:inline-flex" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--muted)] transition hover:text-[var(--ink)]"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell size={16} />
                  {counts.drafts > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--warning)] ring-2 ring-[var(--surface-solid)]" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="admin-card absolute right-0 top-11 z-50 w-80 overflow-hidden p-0 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                      <p className="text-sm font-semibold">Needs attention</p>
                      <span className="badge badge-warning">{counts.drafts}</span>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      <Link href="/admin/courses" className="flex items-start gap-3 px-4 py-3 transition hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                          <BookOpen size={15} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold">{counts.drafts} draft course{counts.drafts === 1 ? "" : "s"}</span>
                          <span className="block text-[11px] text-[var(--muted)]">Finish lessons and publish when ready.</span>
                        </span>
                      </Link>
                      <Link href="/admin/students" className="flex items-start gap-3 px-4 py-3 transition hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
                          <Users size={15} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold">{counts.students} registered student{counts.students === 1 ? "" : "s"}</span>
                          <span className="block text-[11px] text-[var(--muted)]">Manage access and admin roles.</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/"
                target="_blank"
                className="hidden h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] sm:flex"
              >
                <ExternalLink size={14} /> View site
              </Link>

              <Link href="/dashboard" className="ml-1 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] p-1 pr-2.5 transition hover:border-[var(--line-strong)]">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                  {initials(user.name || "Admin")}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block text-[11px] font-semibold leading-tight">{firstName}</span>
                  <span className="block text-[9px] uppercase tracking-wide text-[var(--muted)]">{roleLabel(user.role)}</span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] scroll-mt-24 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-[11px] text-[var(--muted)] sm:px-6 lg:px-8">
          <span>LearnHub · {consoleLabel} control center</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${localMode ? "bg-[var(--warning)]" : "bg-[var(--success)]"}`} />
            {localMode ? "Sample data · local preview" : "Supabase connected"}
          </span>
        </footer>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/55 p-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin quick jump"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
              <Command size={18} className="text-[var(--muted)]" />
              <input
                ref={paletteInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                placeholder="Jump to a page or action…"
              />
              <kbd className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">Esc</kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {paletteItems.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">No matches for “{query}”.</p>
              )}
              {paletteItems.map((item) => (
                <button
                  key={`${item.group}-${item.href}`}
                  type="button"
                  onClick={() => {
                    setPaletteOpen(false);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)]">
                    <item.icon size={15} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-[11px] text-[var(--muted)]">{item.group} · {item.href}</span>
                  </span>
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
