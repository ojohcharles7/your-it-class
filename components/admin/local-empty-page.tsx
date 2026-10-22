import { Link } from "@/components/console-link";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { LocalModeBanner } from "@/components/admin/local-mode-banner";

type Stat = { label: string; value: string | number; hint: string; icon: LucideIcon };

type LocalEmptyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  banner: string;
  stats: Stat[];
  columns: string[];
  emptyTitle: string;
  emptyDescription: string;
  action?: { href: string; label: string; external?: boolean };
};

export function LocalEmptyPage({
  eyebrow,
  title,
  description,
  banner,
  stats,
  columns,
  emptyTitle,
  emptyDescription,
  action,
}: LocalEmptyPageProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>

      <LocalModeBanner message={banner} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-lg font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">0 records · local preview</p>
          {action && (
            <Link
              href={action.href}
              target={action.external ? "_blank" : undefined}
              className="btn btn-sm"
            >
              <Plus size={14} /> {action.label}
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[760px]">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <div className="px-6 py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]">
            <span className="text-lg">◌</span>
          </span>
          <h2 className="mt-3 text-sm font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[var(--muted)]">{emptyDescription}</p>
          <Link href="/admin" className="btn btn-sm mt-4">View setup checklist</Link>
        </div>
      </div>
    </div>
  );
}
