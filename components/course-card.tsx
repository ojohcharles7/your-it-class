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
      className="glass card-hover group flex flex-col overflow-hidden"
    >
      <div
        className="relative h-40 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#fff_0,transparent_45%),radial-gradient(circle_at_80%_80%,#fff_0,transparent_40%)]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-lg">
              {course.emoji}
            </span>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <span className="absolute left-3 top-3 rounded-lg bg-black/35 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
          {course.category}
        </span>
        <span className="absolute right-3 top-3 rounded-lg bg-black/35 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          {course.level}
        </span>
        {image && (
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-black/30 text-lg backdrop-blur-md">
            {course.emoji}
          </span>
        )}
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
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
            View <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
