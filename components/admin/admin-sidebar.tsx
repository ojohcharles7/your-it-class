"use client";

import { Link } from "@/components/console-link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, CreditCard, FolderOpen, Gauge, LogOut, ShieldCheck, Users } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { initials } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/content", label: "Class content", icon: FolderOpen },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="glass sticky top-24 hidden p-3 lg:block">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent-3)] text-xs font-bold text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-[11px] text-[var(--muted)]">{email}</p>
          </div>
        </div>
        <span className="mx-2 mt-1 inline-flex items-center gap-1 rounded-lg bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-2)]">
          <ShieldCheck size={11} /> Administrator
        </span>
        <div className="divider my-2" />
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="sidebar-link" data-active={active}>
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="divider my-2" />
        <Link href="/dashboard" className="sidebar-link">
          <ArrowLeft size={17} />
          Student dashboard
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="sidebar-link w-full">
            <LogOut size={17} />
            Log out
          </button>
        </form>
      </aside>

      <nav className="glass -mx-1 mb-5 flex gap-1 overflow-x-auto p-1.5 lg:hidden">
        <Link href="/dashboard" className="sidebar-link shrink-0 px-3 py-2 text-xs">
          <ArrowLeft size={15} /> Dashboard
        </Link>
        {nav.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="sidebar-link shrink-0 px-3 py-2 text-xs" data-active={active}>
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
