"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const suggestions = [
  { label: "Learn Python from scratch", q: "Python" },
  { label: "Become a cybersecurity analyst", q: "Security" },
  { label: "Build full-stack websites", q: "Full-Stack" },
];

export function LearningPrompt() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(query: string) {
    router.push(`/courses?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        action="/courses"
        className="glass flex flex-col gap-2 rounded-[22px] p-2.5 transition-colors focus-within:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] sm:flex-row sm:items-center sm:rounded-[26px]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <Sparkles size={17} />
          </span>
          <input
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="I want to become a data analyst…"
            aria-label="Describe what you want to learn"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)] sm:text-base"
          />
        </div>
        <button type="submit" className="btn btn-primary h-12 w-full rounded-2xl px-5 sm:w-auto">
          <Search size={16} className="sm:hidden" />
          Find my path
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Try</span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => go(suggestion.q)}
            className="chip group"
          >
            {suggestion.label}
            <ArrowRight size={12} className="opacity-45 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
