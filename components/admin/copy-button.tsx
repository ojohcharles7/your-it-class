"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "Copy reference" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] hover:text-[var(--ink)]"
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
    </button>
  );
}
