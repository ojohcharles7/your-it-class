"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Role } from "@/lib/types";

type ChromeUser = {
  name: string;
  email: string;
  role: Role;
};

export function AppChrome({ user, children }: { user: ChromeUser | null; children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/dashboard")
  ) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
