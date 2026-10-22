"use client";

import type { ReactNode } from "react";

export function ConfirmButton({
  message,
  className = "btn btn-danger btn-sm",
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
