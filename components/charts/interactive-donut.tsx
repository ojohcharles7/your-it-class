"use client";

import { useState } from "react";

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

export function InteractiveDonut({
  segments,
  centerValue,
  centerLabel,
  formatValue = (value: number) => value.toLocaleString(),
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  formatValue?: (value: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const rings = segments.map((segment, index) => {
    const value = Math.max(0, segment.value);
    const dash = total ? (value / total) * circumference : 0;
    const ring = (
      <circle
        key={segment.label}
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={segment.color}
        strokeWidth={active === index ? 20 : 16}
        strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 70 70)"
        className="cursor-pointer transition-all duration-300 focus:outline-none"
        style={{ opacity: active !== null && active !== index ? 0.3 : 1 }}
        tabIndex={0}
        role="img"
        aria-label={`${segment.label}: ${formatValue(value)}`}
        onMouseEnter={() => setActive(index)}
        onMouseLeave={() => setActive(null)}
        onFocus={() => setActive(index)}
        onBlur={() => setActive(null)}
        onClick={() => setActive((current) => (current === index ? null : index))}
      />
    );
    offset += dash;
    return ring;
  });

  const current = active !== null ? segments[active] : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full" role="group" aria-label="Chart breakdown">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="color-mix(in srgb, var(--muted) 14%, transparent)"
            strokeWidth="16"
          />
          {rings}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-bold tracking-tight">
              {current ? formatValue(current.value) : centerValue}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {current ? current.label : centerLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-1.5">
        {segments.map((segment, index) => {
          const share = total ? Math.round((Math.max(0, segment.value) / total) * 100) : 0;
          return (
            <button
              key={segment.label}
              type="button"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((currentIndex) => (currentIndex === index ? null : index))}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                active === index
                  ? "bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                  : "hover:bg-[color-mix(in_srgb,var(--muted)_7%,transparent)]"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="flex-1 truncate text-[var(--muted)]">{segment.label}</span>
              <span className="font-semibold">{formatValue(segment.value)}</span>
              <span className="w-8 text-right text-[10px] text-[var(--muted)]">{share}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
