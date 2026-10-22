"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Role } from "@/lib/types";

type ChromeUser = {
  name: string;
  email: string;
  role: Role;
};

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<ChromeUser | null>(null);
  const requested = useRef(false);

  const isPrivate =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/dashboard");

  useEffect(() => {
    if (isPrivate || requested.current) return;
    requested.current = true;

    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { user?: ChromeUser | null } | null) => {
        if (active && data?.user) setUser(data.user);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isPrivate]);

  if (isPrivate) {
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
