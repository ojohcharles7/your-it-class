import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Layers, Star } from "lucide-react";
import type { Course } from "@/lib/types";
import { getCourseImage } from "@/lib/course-media";
import { naira } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  const image = getCourseImage(course.slug);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_86%,transparent)] shadow-[var(--shadow-sm)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_32%,var(--line))] hover:shadow-[0_30px_70px_-25px_rgba(10,132,255,0.35)]"
    >
      <div className="p-2 pb-0">
        <div
          className="relative h-44 overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/20"
          style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
        >
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <>
              <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#fff_0,transparent_45%),radial-gradient(circle_at_80%_80%,#fff_0,transparent_40%)]" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-lg">
                {course.emoji}
              </span>
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/20" />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-50 mix-blend-overlay"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 h-full w-1/2 -translate-x-[180%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
            aria-hidden="true"
          />

          <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)] backdrop-blur-xl">
            {course.category}
          </span>
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)] backdrop-blur-xl">
            {course.level}
          </span>
          {image && (
            <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-xl border border-white/25 bg-white/15 text-lg shadow-[inset_0_1px_0_rgba(255,255,255,.3)] backdrop-blur-xl">
              {course.emoji}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold leading-snug tracking-tight">{course.title}</h3>
        <p className="line-clamp-2 mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{course.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers size={13} /> {course.lessonsCount ?? 0} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {course.hours}h
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span className="text-lg font-bold">{naira(course.priceKobo)}</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)] transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[var(--accent)] group-hover:to-[var(--accent-2)] group-hover:text-white group-hover:shadow-[0_8px_24px_rgba(10,132,255,0.4)]">
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
