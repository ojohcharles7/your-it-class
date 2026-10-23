"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Presentation,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { isAdminRole, isTeacherRole } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My courses", icon: BookOpen },
  { href: "/dashboard/exams", label: "Exams", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/courses", label: "Browse", icon: Compass },
];

export function DashboardSidebar({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="glass sticky top-24 hidden p-3 lg:block">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[11px] text-[var(--muted)]">{user.email}</p>
          </div>
        </div>
        <div className="divider my-2" />
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="sidebar-link" data-active={active}>
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
          {isTeacherRole(user.role) && (
            <Link href="/instructor" className="sidebar-link" data-active={pathname.startsWith("/instructor")}>
              <Presentation size={17} />
              Instructor studio
            </Link>
          )}
          {isAdminRole(user.role) && (
            <Link href="/admin" className="sidebar-link" data-active={pathname.startsWith("/admin")}>
              <ShieldCheck size={17} />
              Admin panel
            </Link>
          )}
        </nav>
        <div className="divider my-2" />
        <form action={signOutAction}>
          <button type="submit" className="sidebar-link w-full">
            <LogOut size={17} />
            Log out
          </button>
        </form>
      </aside>

      <nav className="glass -mx-1 mb-5 flex gap-1 overflow-x-auto p-1.5 lg:hidden">
        {nav.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link shrink-0 px-3 py-2 text-xs"
              data-active={active}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
