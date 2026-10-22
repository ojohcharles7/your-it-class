import Link from "next/link";
import { ArrowRight, CloudOff } from "lucide-react";

export function LocalModeBanner({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-4 sm:flex-row sm:items-center">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]">
        <CloudOff size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">Local preview · sample data</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{message}</p>
      </div>
      <Link href="/admin" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--warning)] hover:underline">
        Setup checklist <ArrowRight size={12} />
      </Link>
    </div>
  );
}
