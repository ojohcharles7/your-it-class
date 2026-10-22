"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { prepareResourceUploadAction, saveResourceUploadAction } from "@/app/admin/actions";
import { formatBytes } from "@/lib/utils";

export function ResourceUploadForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a PDF, DOC or DOCX file to upload.");
      return;
    }

    const cleanTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const target = await prepareResourceUploadAction({
        courseId,
        title: cleanTitle,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (target.error || !target.path || !target.token) {
        setError(target.error ?? "Could not start the upload.");
        return;
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      if (!url || !key) {
        setError("Supabase is not connected yet.");
        return;
      }

      const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const lower = file.name.toLowerCase();
      const contentType = file.type || (lower.endsWith(".doc")
        ? "application/msword"
        : lower.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf");

      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .uploadToSignedUrl(target.path, target.token, file, { contentType });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const saved = await saveResourceUploadAction({
        courseId,
        title: cleanTitle,
        path: target.path,
        fileName: file.name,
        fileType: contentType,
        fileSize: file.size,
      });

      if (saved.error) {
        setError(saved.error);
        return;
      }

      setMessage(saved.message ?? "Document uploaded.");
      setTitle("");
      setFile(null);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--danger)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {message && (
        <p className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-xs leading-relaxed text-[var(--success)]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}

      <label className="field">
        <span className="label">Document title</span>
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Week 1 — HTML cheat sheet"
        />
      </label>

      <label className="field">
        <span className="label">PDF or Word file</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="input h-auto cursor-pointer py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            if (selected && !title.trim()) {
              setTitle(selected.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
            }
          }}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--muted)]">
          {file ? `${file.name} · ${formatBytes(file.size)}` : "PDF, DOC or DOCX · up to 25 MB"}
        </p>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          {pending ? "Uploading…" : "Upload document"}
        </button>
      </div>
    </form>
  );
}
