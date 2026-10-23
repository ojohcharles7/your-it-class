"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentLinkProps = ComponentProps<typeof Link>;

export function IntentLink({
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: IntentLinkProps) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
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
