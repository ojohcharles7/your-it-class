"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { deleteLessonAction, saveLessonAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { AdminActionState, Lesson } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {pending ? "Saving…" : label}
    </button>
  );
}

function LessonForm({
  courseId,
  lesson,
  nextPosition,
}: {
  courseId: string;
  lesson?: Lesson;
  nextPosition: number;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(saveLessonAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      {lesson?.hasVideo && <input type="hidden" name="keepVideo" value="on" />}
      <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
        <div>
          <label className="label">Position</label>
          <input
            name="position"
            type="number"
            min={1}
            className="input"
            defaultValue={lesson?.position ?? nextPosition}
            required
          />
        </div>
        <div>
          <label className="label">Lesson title</label>
          <input name="title" className="input" defaultValue={lesson?.title} placeholder="e.g. Setting up your tools" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <div>
          {lesson?.hasVideo ? (
            <>
              <span className="label">Uploaded video</span>
              <p className="rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--success)_6%,transparent)] p-3 text-xs text-[var(--muted)]">
                This lesson uses an uploaded video. Manage or replace it from the teacher&apos;s Course studio.
              </p>
            </>
          ) : (
            <>
              <label className="label">YouTube video ID or URL</label>
              <input
                name="youtubeId"
                className="input font-mono text-xs"
                defaultValue={lesson?.youtubeId}
                placeholder="dQw4w9WgXcQ or https://youtu.be/…"
                required
              />
            </>
          )}
        </div>
        <div>
          <label className="label">Duration (min)</label>
          <input
            name="durationMin"
            type="number"
            min={1}
            className="input"
            defaultValue={lesson?.durationMin ?? 15}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            name="isFree"
            defaultChecked={lesson?.isFree ?? false}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Free preview lesson
        </label>
        <SubmitButton label={lesson ? "Update lesson" : "Add lesson"} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.message && <p className="text-xs text-[var(--success)]">{state.message}</p>}
    </form>
  );
}

export function LessonEditor({ courseId, lessons }: { courseId: string; lessons: Lesson[] }) {
  return (
    <section className="admin-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Curriculum</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {lessons.length} lessons. The first lesson can be marked as a free preview.
          </p>
        </div>
        <span className="badge badge-accent">{lessons.length}</span>
      </div>

      <div className="mt-4 space-y-2">
        {lessons.map((lesson) => (
          <details key={lesson.id} className="group rounded-xl border border-[var(--line)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] text-[11px] font-bold text-[var(--muted)]">
                {lesson.position}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
              <span className="hidden text-[11px] text-[var(--muted)] sm:inline">{lesson.durationMin} min</span>
              {lesson.isFree && <span className="badge badge-success">Free</span>}
              <ChevronDown size={15} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-[var(--line)] p-3">
              <LessonForm courseId={courseId} lesson={lesson} nextPosition={lesson.position} />
              <form action={deleteLessonAction} className="mt-3 flex justify-end border-t border-[var(--line)] pt-3">
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="courseId" value={courseId} />
                <ConfirmButton message={`Delete “${lesson.title}”? Learner progress for this lesson will also be removed.`}>
                  <Trash2 size={13} /> Delete lesson
                </ConfirmButton>
              </form>
            </div>
          </details>
        ))}
        {lessons.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            No lessons yet. Add the first lesson below.
          </p>
        )}
      </div>

      <details className="mt-4 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <Plus size={16} className="text-[var(--accent)]" /> Add a new lesson
        </summary>
        <div className="border-t border-[var(--line)] p-3">
          <LessonForm key={`add-${lessons.length}`} courseId={courseId} nextPosition={lessons.length + 1} />
        </div>
      </details>
    </section>
  );
}
