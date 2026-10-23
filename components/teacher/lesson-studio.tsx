"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Film,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Link2,
} from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { AdminActionState, Lesson } from "@/lib/types";
import { MAX_VIDEO_BYTES, VIDEO_ACCEPT, videoContentType } from "@/lib/uploads";
import { formatBytes } from "@/lib/utils";

export type LessonStudioActions = {
  prepare: (input: {
    courseId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => Promise<{ error?: string; path?: string; token?: string }>;
  save: (input: {
    id?: string;
    courseId: string;
    position: number;
    title: string;
    youtubeId?: string;
    durationMin: number;
    isFree: boolean;
    videoPath?: string;
    videoMime?: string;
    videoSize?: number;
    keepVideo?: boolean;
  }) => Promise<AdminActionState>;
  delete: (formData: FormData) => Promise<void>;
};

function LessonForm({
  courseId,
  lesson,
  nextPosition,
  actions,
}: {
  courseId: string;
  lesson?: Lesson;
  nextPosition: number;
  actions: LessonStudioActions;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const youtube = String(data.get("youtubeId") ?? "").trim();
    const position = Number(data.get("position"));
    const durationMin = Number(data.get("durationMin"));

    if (!file && !youtube && !lesson?.hasVideo) {
      setError("Upload a video file or add a YouTube video ID.");
      return;
    }
    if (file && youtube) {
      setError("Choose either an uploaded video or a YouTube link, not both.");
      return;
    }
    if (file && file.size > MAX_VIDEO_BYTES) {
      setError("Videos must be 500 MB or smaller.");
      return;
    }

    setError(null);
    setMessage(null);
    setStatus(file ? "Uploading video…" : "Saving lesson…");

    startTransition(async () => {
      let videoPath: string | undefined;
      let videoMime: string | undefined;
      let videoSize: number | undefined;

      if (file) {
        const target = await actions.prepare({
          courseId,
          fileName: file.name,
          fileType: videoContentType(file.name, file.type),
          fileSize: file.size,
        });
        if (target.error || !target.path || !target.token) {
          setError(target.error ?? "Could not start the video upload.");
          setStatus(null);
          return;
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
        if (!url || !key) {
          setError("Supabase is not connected yet.");
          setStatus(null);
          return;
        }

        const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error: uploadError } = await supabase.storage
          .from("course-videos")
          .uploadToSignedUrl(target.path, target.token, file, { contentType: videoContentType(file.name, file.type) });
        if (uploadError) {
          setError(uploadError.message);
          setStatus(null);
          return;
        }

        videoPath = target.path;
        videoMime = videoContentType(file.name, file.type);
        videoSize = file.size;
      }

      const saved = await actions.save({
        id: lesson?.id,
        courseId,
        position,
        title,
        youtubeId: file ? "" : youtube,
        durationMin,
        isFree: data.get("isFree") === "on",
        videoPath,
        videoMime,
        videoSize,
        keepVideo: !file && !youtube ? Boolean(lesson?.hasVideo) : false,
      });

      if (saved.error) {
        setError(saved.error);
        setStatus(null);
        return;
      }

      setMessage(saved.message ?? "Lesson saved.");
      setStatus(null);
      formRef.current?.reset();
      setFile(null);
      setFileKey((value) => value + 1);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      {message && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {message}
        </p>
      )}

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

      <div className="rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {lesson?.hasVideo ? <Film size={15} className="text-[var(--accent)]" /> : <Link2 size={15} className="text-[var(--danger)]" />}
            {lesson?.hasVideo
              ? `Uploaded video${lesson.videoSize ? ` · ${formatBytes(lesson.videoSize)}` : ""}`
              : lesson
                ? "YouTube lesson"
                : "Video source"}
          </div>
          {lesson?.hasVideo && <span className="badge badge-success">Uploaded</span>}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
          <div>
            <label className="label">{lesson?.hasVideo ? "Replace with uploaded video" : "Upload video file"}</label>
            <input
              key={fileKey}
              type="file"
              accept={VIDEO_ACCEPT}
              className="input h-auto cursor-pointer py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-1.5 file:text-xs file:font-semibold"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-[10px] text-[var(--muted)]">MP4, WebM, OGG, MOV or M4V · up to 500 MB</p>
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

        <div className="my-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" /> or use a link <span className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <div>
          <label className="label">YouTube video ID or URL</label>
          <input
            name="youtubeId"
            className="input font-mono text-xs"
            defaultValue={lesson?.youtubeId}
            placeholder="dQw4w9WgXcQ or https://youtu.be/…"
            disabled={Boolean(file)}
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
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : file ? <Upload size={14} /> : <Save size={14} />}
          {status ?? (lesson ? "Update lesson" : "Add lesson")}
        </button>
      </div>
      {file && <p className="text-[11px] text-[var(--muted)]">{file.name} · {formatBytes(file.size)}</p>}
    </form>
  );
}

export function LessonStudio({
  courseId,
  lessons,
  actions,
}: {
  courseId: string;
  lessons: Lesson[];
  actions: LessonStudioActions;
}) {
  return (
    <section className="admin-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Course videos</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · upload a video file or paste a YouTube link.
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
              {lesson.hasVideo ? (
                <span className="badge badge-success"><Film size={10} /> Video</span>
              ) : lesson.youtubeId ? (
                <span className="badge badge-muted"><Link2 size={10} /> YouTube</span>
              ) : (
                <span className="badge badge-warning">No video</span>
              )}
              {lesson.isFree && <span className="badge badge-success">Free</span>}
              <ChevronDown size={15} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-[var(--line)] p-3">
              <LessonForm courseId={courseId} lesson={lesson} nextPosition={lesson.position} actions={actions} />
              <form action={actions.delete} className="mt-3 flex justify-end border-t border-[var(--line)] pt-3">
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="courseId" value={courseId} />
                <ConfirmButton message={`Delete “${lesson.title}”? The uploaded video and learner progress for this lesson will also be removed.`}>
                  <Trash2 size={13} /> Delete lesson
                </ConfirmButton>
              </form>
            </div>
          </details>
        ))}
        {lessons.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            No videos yet. Add your first lesson below.
          </p>
        )}
      </div>

      <details className="mt-4 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <Plus size={16} className="text-[var(--accent)]" /> Add a lesson video
        </summary>
        <div className="border-t border-[var(--line)] p-3">
          <LessonForm key={`add-${lessons.length}`} courseId={courseId} nextPosition={lessons.length + 1} actions={actions} />
        </div>
      </details>
    </section>
  );
}
