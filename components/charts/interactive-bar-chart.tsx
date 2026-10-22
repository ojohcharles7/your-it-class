"use client";

import { useMemo, useState } from "react";

export type BarSeries = {
  name: string;
  color: string;
  values: number[];
};

type ActiveBar = { label: number; series: number } | null;

export function InteractiveBarChart({
  labels,
  series,
  height = 200,
  formatValue = (value: number) => value.toLocaleString(),
}: {
  labels: string[];
  series: BarSeries[];
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const [enabled, setEnabled] = useState<boolean[]>(() => series.map(() => true));
  const [active, setActive] = useState<ActiveBar>(null);

  const max = useMemo(() => {
    let peak = 0;
    series.forEach((item, index) => {
      if (!enabled[index]) return;
      for (const value of item.values) peak = Math.max(peak, value);
    });
    return peak;
  }, [series, enabled]);

  function toggle(index: number) {
    setEnabled((previous) => {
      const next = [...previous];
      next[index] = !next[index];
      return next.every((value) => !value) ? previous : next;
    });
    setActive(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {series.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => toggle(index)}
            aria-pressed={enabled[index]}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
              enabled[index]
                ? "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] opacity-55"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.name}
          </button>
        ))}
      </div>

      <div className="relative mt-6" style={{ height }}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} className="block border-t border-dashed border-[var(--line)] first:border-t-0" />
          ))}
        </div>

        <div className="relative flex h-full items-end gap-1.5 sm:gap-2.5">
          {labels.map((label, labelIndex) => (
            <div key={`${label}-${labelIndex}`} className="flex h-full flex-1 items-end justify-center gap-0.5 sm:gap-1">
              {series.map((item, seriesIndex) => {
                if (!enabled[seriesIndex]) return null;
                const value = item.values[labelIndex] ?? 0;
                const percent = max ? (value / max) * 100 : 0;
                const isActive = active?.label === labelIndex && active?.series === seriesIndex;

                return (
                  <div key={`${labelIndex}-${seriesIndex}`} className="relative flex h-full w-full max-w-4 items-end justify-center">
                    <button
                      type="button"
                      className="w-full rounded-t-[5px] transition-all duration-300 focus-visible:outline-none"
                      style={{
                        height: `${Math.max(percent, value > 0 ? 2 : 0)}%`,
                        background: `linear-gradient(180deg, ${item.color}, color-mix(in srgb, ${item.color} 45%, transparent))`,
                        opacity: active && !isActive ? 0.4 : 1,
                      }}
                      onMouseEnter={() => setActive({ label: labelIndex, series: seriesIndex })}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive({ label: labelIndex, series: seriesIndex })}
                      onBlur={() => setActive(null)}
                      aria-label={`${label} · ${item.name}: ${formatValue(value)}`}
                    />

                    {isActive && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--line)] bg-[var(--surface-solid)] px-2.5 py-1.5 shadow-lg">
                        <p className="text-[10px] font-semibold text-[var(--muted)]">
                          {label} · {item.name}
                        </p>
                        <p className="text-xs font-bold">{formatValue(value)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {labels.map((label, index) => (
          <span key={`${label}-axis-${index}`} className="flex-1 text-center text-[10px] font-medium text-[var(--muted)]">
            {label}
          </span>
        ))}
      </div>

      {max === 0 && <p className="mt-3 text-center text-xs text-[var(--muted)]">No activity recorded for this period yet.</p>}
    </div>
  );
}
