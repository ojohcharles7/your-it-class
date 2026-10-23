"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentProps } from "react";

export function consoleHref(href: string, pathname: string) {
  if (!pathname.startsWith("/master")) return href;
  if (href === "/admin") return "/master";
  if (href.startsWith("/admin/") || href.startsWith("/admin?")) {
    return `/master${href.slice("/admin".length)}`;
  }
  return href;
}

export function Link({
  href,
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof NextLink>) {
  const pathname = usePathname() ?? "";
  const [intent, setIntent] = useState(false);

  return (
    <NextLink
      href={typeof href === "string" ? consoleHref(href, pathname) : href}
      {...props}
      prefetch={prefetch ?? intent}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
