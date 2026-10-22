import { naira, nairaCompact } from "@/lib/utils";

type Point = { x: number; y: number };

function smoothPath(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function Sparkline({ values }: { values: number[] }) {
  const width = 128;
  const height = 38;
  const pad = 3;
  const series = values.length > 1 ? values : [0, ...values];
  const max = Math.max(1, ...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const points = series.map((value, index) => ({
    x: pad + (index / Math.max(1, series.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }));
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-24 shrink-0" aria-hidden="true" preserveAspectRatio="none">
      <path d={area} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RevenueAreaChart({ data }: { data: { label: string; total: number }[] }) {
  const width = 760;
  const height = 260;
  const padLeft = 58;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const max = Math.max(1, ...data.map((item) => item.total));
  const niceMax = max * 1.12;
  const baseline = height - padBottom;
  const points = data.map((item, index) => ({
    x: padLeft + (index / Math.max(1, data.length - 1)) * (width - padLeft - padRight),
    y: padTop + (1 - item.total / niceMax) * (height - padTop - padBottom),
  }));
  const line = smoothPath(points);
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-auto w-full" role="img" aria-label="Revenue over the last six months">
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>

      {gridValues.map((value) => {
        const y = padTop + value * (height - padTop - padBottom);
        return (
          <g key={value}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeDasharray={value === 1 ? undefined : "3 5"}
            />
            <text x={padLeft - 10} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">
              {nairaCompact((1 - value) * niceMax)}
            </text>
          </g>
        );
      })}

      <path d={area} fill="url(#revenueFill)" />
      <path d={line} fill="none" stroke="url(#revenueStroke)" strokeWidth="2.5" strokeLinecap="round" />

      {points.map((point, index) => (
        <g key={`${data[index].label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="4" fill="var(--surface-solid)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx={point.x} cy={point.y} r="14" fill="transparent">
            <title>{`${data[index].label}: ${naira(data[index].total)}`}</title>
          </circle>
          <text x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {data[index].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function CompletionDonut({ percent, completed, active }: { percent: number; completed: number; active: number }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div
        className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--success) 0% ${value}%, color-mix(in srgb, var(--muted) 14%, transparent) ${value}% 100%)`,
        }}
        role="img"
        aria-label={`${value}% of enrolments completed`}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-[var(--surface-solid)] text-center">
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Completed</p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Completed
          </span>
          <span className="font-semibold">{completed.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[color-mix(in_srgb,var(--muted)_30%,transparent)]" /> In progress
          </span>
          <span className="font-semibold">{active.toLocaleString()}</span>
        </div>
        <div className="h-px bg-[var(--line)]" />
        <p className="text-[11px] leading-relaxed text-[var(--muted)]">
          Completion is based on enrolments marked completed after the final exam.
        </p>
      </div>
    </div>
  );
}
