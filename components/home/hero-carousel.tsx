"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers,
  Pause,
  Play,
  Star,
} from "lucide-react";
import type { Course } from "@/lib/types";
import { getCourseImage } from "@/lib/course-media";
import { naira } from "@/lib/utils";

const DURATION = 5200;

const positions = {
  center: "left-1/2 z-30 -translate-x-1/2 scale-100 opacity-100",
  prev: "left-1/2 z-20 -translate-x-[112%] scale-[0.84] -rotate-[3deg] opacity-60",
  next: "left-1/2 z-20 translate-x-[12%] scale-[0.84] rotate-[3deg] opacity-60",
  hiddenLeft: "left-1/2 z-10 -translate-x-[150%] scale-[0.64] -rotate-[6deg] opacity-0",
  hiddenRight: "left-1/2 z-10 translate-x-[50%] scale-[0.64] rotate-[6deg] opacity-0",
};

export function HeroCarousel({ courses }: { courses: Course[] }) {
  const slides = useMemo(() => {
    const seen = new Set<string>();
    return courses
      .filter((course) => {
        if (seen.has(course.category)) return false;
        seen.add(course.category);
        return true;
      })
      .slice(0, 5);
  }, [courses]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = slides[active];

  useEffect(() => {
    if (active > count - 1) setActive(0);
  }, [active, count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % count), DURATION);
    return () => window.clearTimeout(timer);
  }, [active, count, paused]);

  if (!current) return null;

  const step = (direction: number) => setActive((value) => (value + direction + count) % count);

  return (
    <div>
      <div className="relative mx-auto h-[360px] w-full max-w-[1280px] sm:h-[450px] lg:h-[520px]">
        {slides.map((course, index) => {
          const offset = (index - active + count) % count;
          const image = getCourseImage(course.slug);
          const position =
            offset === 0
              ? "center"
              : offset === 1
                ? "next"
                : offset === count - 1
                  ? "prev"
                  : offset === 2
                    ? "hiddenRight"
                    : "hiddenLeft";

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${course.category}: ${course.title}`}
              aria-current={position === "center" ? "true" : undefined}
              tabIndex={position === "center" ? 0 : -1}
              className={`absolute top-0 w-full max-w-[880px] text-left transition-all duration-700 ease-[cubic-bezier(.2,.7,.3,1)] ${
                positions[position]
              } ${position === "center" ? "" : "hidden md:block"}`}
            >
              <div
                className={`relative h-[360px] overflow-hidden rounded-[30px] border border-white/15 text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.75)] transition-shadow duration-700 sm:h-[450px] lg:h-[520px] ${
                  position === "center" ? "ring-1 ring-white/20" : ""
                }`}
                style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 880px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_18%,#fff_0,transparent_42%),radial-gradient(circle_at_82%_78%,#fff_0,transparent_38%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
                <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:48px_48px]" />

                <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
                      {course.category}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-black/25 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                      <Star size={12} className="fill-amber-300 text-amber-300" />
                      {course.rating.toFixed(1)}
                    </span>
                  </div>

                  {!image && (
                    <span className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-[62%] place-items-center rounded-[30px] border border-white/25 bg-white/12 text-6xl shadow-[0_24px_60px_rgba(0,0,0,.35)] backdrop-blur-md sm:h-36 sm:w-36 sm:text-7xl">
                      {course.emoji}
                    </span>
                  )}

                  <div className="relative mt-auto">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                      <span className="text-sm leading-none">{course.emoji}</span> Career path
                    </p>
                    <h3 className="mt-1.5 max-w-lg text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                      {course.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-white/80 sm:text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers size={13} /> {course.lessonsCount ?? 0} lessons
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} /> {course.hours} hours
                      </span>
                      <span className="inline-flex items-center gap-1.5">{course.level}</span>
                      <span className="ml-auto rounded-lg bg-white/15 px-2.5 py-1 font-semibold text-white backdrop-blur-sm">
                        {naira(course.priceKobo)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col items-center gap-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => step(-1)}
            className="btn icon-btn btn-ghost btn-sm shrink-0"
            aria-label="Previous course"
          >
            <ChevronLeft size={15} />
          </button>
          {slides.map((course, index) => (
            <button
              key={course.id}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              className={`relative overflow-hidden rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-wide transition-colors sm:text-xs ${
                index === active
                  ? "bg-[var(--ink)] text-[var(--surface-solid)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {course.category}
              {index === active && count > 1 && (
                <span className="absolute inset-x-2 bottom-1 block h-px overflow-hidden">
                  <span
                    key={active}
                    className="hero-tab-progress block h-full w-full bg-[var(--accent)]"
                    style={{ animationPlayState: paused ? "paused" : "running" }}
                  />
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => step(1)}
            className="btn icon-btn btn-ghost btn-sm shrink-0"
            aria-label="Next course"
          >
            <ChevronRight size={15} />
          </button>
          <span className="mx-0.5 h-5 w-px bg-[var(--line)]" />
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="btn icon-btn btn-ghost btn-sm shrink-0"
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">{current.description}</p>
          <Link href={`/courses/${current.slug}`} className="btn btn-primary shrink-0">
            Explore this path <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
