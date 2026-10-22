import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(10,132,255,0.35)]">
        IT
      </span>
      {!compact && (
        <span className="text-[15px] leading-none">
          Your IT Class
        </span>
      )}
    </Link>
  );
}
