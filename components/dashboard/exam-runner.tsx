"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { submitExamAction, type ExamResultState } from "@/app/actions/exams";

type Question = { id: string; prompt: string; options: string[] };

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamRunner({
  examId,
  sessionId,
  secondsRemaining,
  courseTitle,
  courseSlug,
  passScore,
  questions,
}: {
  examId: string;
  sessionId: string | null;
  secondsRemaining: number;
  courseTitle: string;
  courseSlug: string;
  passScore: number;
  questions: Question[];
}) {
  const [state, action, pending] = useActionState<ExamResultState, FormData>(submitExamAction, {});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(secondsRemaining);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  const finished = typeof state.score === "number";
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (finished) return;
    if (secondsLeft <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        formRef.current?.requestSubmit();
      }
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, finished]);

  useEffect(() => {
    if (finished) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [finished]);

  const answersJson = useMemo(() => JSON.stringify(answers), [answers]);

  if (finished) {
    const percent = state.percent ?? 0;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass overflow-hidden">
          <div className={`p-8 text-center text-white ${state.passed ? "bg-gradient-to-br from-[#0f9d63] to-[#0a84ff]" : "bg-gradient-to-br from-[#d97706] to-[#ff375f]"}`}>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15">
              {state.passed ? <Award size={32} /> : <XCircle size={32} />}
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {state.passed ? "Congratulations, you passed!" : "Not quite — try again"}
            </h1>
            <p className="mt-1 text-sm text-white/85">{courseTitle}</p>
            <div className="mt-5 flex items-end justify-center gap-2">
              <span className="text-5xl font-bold">{percent}%</span>
              <span className="pb-1.5 text-sm text-white/80">
                ({state.score}/{state.total} correct)
              </span>
            </div>
            <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-xs text-white/80">Pass mark: {passScore}%</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3 text-sm">
                <span className="text-[var(--muted)]">Questions answered</span>
                <strong>{answeredCount} / {questions.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3 text-sm">
                <span className="text-[var(--muted)]">Result</span>
                <span className={`badge ${state.passed ? "badge-success" : "badge-warning"}`}>
                  {state.passed ? "Passed" : "Failed"}
                </span>
              </div>
            </div>

            {state.passed && state.certificateSerial && (
              <Link href={`/certificate/${state.certificateSerial}`} className="btn btn-primary mt-4 w-full">
                <Award size={16} /> View your certificate
              </Link>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/dashboard/courses/${courseSlug}`} className="btn flex-1">
                <ChevronLeft size={15} /> Back to course
              </Link>
              <button type="button" className="btn flex-1" onClick={() => window.location.reload()}>
                <RotateCcw size={15} /> Retake exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="sessionId" value={sessionId ?? ""} />
      <input type="hidden" name="answers" value={answersJson} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/exams" className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]">
            <ChevronLeft size={14} /> All exams
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{courseTitle} — Final exam</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {questions.length} questions · pass mark {passScore}% · best of unlimited attempts
          </p>
        </div>
        <div className={`glass flex items-center gap-2 px-4 py-2.5 ${secondsLeft < 60 ? "text-[var(--danger)]" : ""}`}>
          <Clock size={16} />
          <span className="font-mono text-lg font-bold tabular-nums">{formatTime(secondsLeft)}</span>
        </div>
      </div>

      <div className="glass p-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{answeredCount} of {questions.length} answered</span>
          <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
        </div>
        <div className="progress mt-2">
          <span style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <div className="space-y-4">
        {questions.map((question, questionIndex) => (
          <fieldset key={question.id} className="glass p-5">
            <legend className="sr-only">Question {questionIndex + 1}</legend>
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-bold text-[var(--accent)]">
                {questionIndex + 1}
              </span>
              <p className="pt-1 text-sm font-semibold leading-relaxed">{question.prompt}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex;
                return (
                  <label
                    key={optionIndex}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition-colors ${
                      selected
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      className="sr-only"
                      checked={selected}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    />
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                      selected
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[var(--line-strong)] text-[var(--muted)]"
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    {option}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <FileText size={15} />
          Your answers are scored on the server.
        </div>
        <div className="flex items-center gap-2">
          {answeredCount < questions.length && (
            <span className="text-xs text-[var(--warning)]">
              {questions.length - answeredCount} unanswered
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {pending ? "Scoring…" : "Submit exam"}
          </button>
        </div>
      </div>

      {answeredCount === questions.length && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--success)]">
          <CheckCircle2 size={14} /> All questions answered — you can submit when ready.
        </p>
      )}
    </form>
  );
}
