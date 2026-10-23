"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Lock,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { setLessonComplete } from "@/app/actions/progress";
import type { Course, Exam, Lesson } from "@/lib/types";
import type { CourseResourceLink } from "@/lib/data";
import { formatBytes } from "@/lib/utils";

function CompleteButton({
  lessonId,
  courseId,
  slug,
  completed,
}: {
  lessonId: string;
  courseId: string;
  slug: string;
  completed: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <form action={setLessonComplete}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="completed" value={String(!completed)} />
      <button type="submit" className={`btn ${completed ? "" : "btn-primary"}`} disabled={pending}>
        {completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
        {pending ? "Saving…" : completed ? "Mark as incomplete" : "Mark complete"}
      </button>
    </form>
  );
}

export function LessonPlayer({
  course,
  lessons,
  resources,
  completedIds,
  progress,
  exam,
  certificate,
}: {
  course: Course;
  lessons: Lesson[];
  resources: CourseResourceLink[];
  completedIds: string[];
  progress: number;
  exam: Exam | null;
  certificate: { serial: string } | null;
}) {
  const completed = new Set(completedIds);
  const firstIncomplete = lessons.findIndex((lesson) => !completed.has(lesson.id));
  const [index, setIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const lesson = lessons[index];
  const isComplete = lesson ? completed.has(lesson.id) : false;
  const hasNext = index < lessons.length - 1;

  if (!lesson) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-sm text-[var(--muted)]">This course has no lessons yet.</p>
        <Link href="/dashboard/courses" className="btn mt-4">Back to my courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]">
            <ChevronLeft size={14} /> My courses
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{course.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">Progress</p>
            <p className="text-sm font-bold">{progress}%</p>
          </div>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)]">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-4">
          <div className="glass overflow-hidden p-2">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              {lesson.hasVideo ? (
                <video
                  key={lesson.id}
                  className="absolute inset-0 h-full w-full"
                  controls
                  playsInline
                  preload="metadata"
                  src={`/api/lesson-video?lessonId=${lesson.id}`}
                >
                  Your browser cannot play this video.
                </video>
              ) : lesson.youtubeId ? (
                <iframe
                  key={lesson.id}
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}?rel=0`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
                  This lesson video has not been uploaded yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Lesson {index + 1} of {lessons.length}
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight">{lesson.title}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{lesson.durationMin} minutes · video lesson</p>
              </div>
              {isComplete && <span className="badge badge-success"><CheckCircle2 size={11} /> Completed</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CompleteButton lessonId={lesson.id} courseId={course.id} slug={course.slug} completed={isComplete} />
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setIndex((value) => Math.max(0, value - 1))}
                  disabled={index === 0}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setIndex((value) => Math.min(lessons.length - 1, value + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={!hasNext}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {resources.length > 0 && (
            <div className="glass p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] text-[var(--accent-2)]">
                  <FileText size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Class handouts</p>
                  <p className="text-[11px] text-[var(--muted)]">PDF and Word documents for this class.</p>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-[var(--line)]">
                {resources.map((resource) => (
                  <li key={resource.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <FileText size={15} className="shrink-0 text-[var(--muted)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{resource.title}</p>
                      <p className="truncate text-[10px] text-[var(--muted)]">
                        {resource.fileName} · {formatBytes(resource.sizeBytes)}
                      </p>
                    </div>
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                      >
                        <Download size={13} /> Download
                      </a>
                    ) : (
                      <span className="badge badge-muted">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                  <FileText size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Final exam</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {progress === 100 ? "Unlocked · ready to take" : "Finish all lessons to unlock"}
                  </p>
                </div>
              </div>
              {progress === 100 && exam ? (
                <Link href={`/dashboard/exams/${exam.id}`} className="btn btn-primary btn-sm mt-3 w-full">
                  Start exam <ChevronRight size={14} />
                </Link>
              ) : (
                <button type="button" className="btn btn-sm mt-3 w-full" disabled>
                  <Lock size={13} /> Locked
                </button>
              )}
            </div>
            <div className="glass p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]">
                  {certificate ? <Trophy size={17} /> : <Award size={17} />}
                </span>
                <div>
                  <p className="text-sm font-semibold">Certificate</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {certificate ? "Issued · ready to share" : "Pass the exam to earn it"}
                  </p>
                </div>
              </div>
              {certificate ? (
                <Link href={`/certificate/${certificate.serial}`} className="btn btn-sm mt-3 w-full">
                  View certificate
                </Link>
              ) : (
                <button type="button" className="btn btn-sm mt-3 w-full" disabled>
                  Not issued yet
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="glass overflow-hidden xl:sticky xl:top-24">
          <div className="border-b border-[var(--line)] p-4">
            <p className="text-sm font-semibold">Course content</p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              {completed.size} of {lessons.length} lessons complete
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {lessons.map((item, itemIndex) => {
              const done = completed.has(item.id);
              const active = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIndex(itemIndex);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors ${
                    active
                      ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                      : "hover:bg-[color-mix(in_srgb,var(--muted)_8%,transparent)]"
                  }`}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                    done
                      ? "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)]"
                      : active
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] text-[var(--muted)]"
                  }`}>
                    {done ? <CheckCircle2 size={14} /> : itemIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-xs font-medium ${active ? "text-[var(--accent)]" : ""}`}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">{item.durationMin} min</span>
                  </span>
                  {active && <PlayCircle size={14} className="shrink-0 text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
