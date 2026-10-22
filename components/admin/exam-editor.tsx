"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown, HelpCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { deleteQuestionAction, saveExamAction, saveQuestionAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { AdminActionState, Exam } from "@/lib/types";

type AdminQuestion = {
  id: string;
  examId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  position: number;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {pending ? "Saving…" : label}
    </button>
  );
}

function ExamSettingsForm({ courseId, exam }: { courseId: string; exam: Exam | null }) {
  const [state, action] = useActionState<AdminActionState, FormData>(saveExamAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <div>
        <label className="label">Exam title</label>
        <input
          name="title"
          className="input"
          defaultValue={exam?.title ?? "Final Exam"}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Pass mark (%)</label>
          <input
            name="passScore"
            type="number"
            min={1}
            max={100}
            className="input"
            defaultValue={exam?.passScore ?? 70}
            required
          />
        </div>
        <div>
          <label className="label">Time limit (min)</label>
          <input
            name="timeLimitMin"
            type="number"
            min={1}
            max={180}
            className="input"
            defaultValue={exam?.timeLimitMin ?? 15}
            required
          />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton label={exam ? "Save exam settings" : "Create exam"} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.message && <p className="text-xs text-[var(--success)]">{state.message}</p>}
    </form>
  );
}

function QuestionForm({
  courseId,
  examId,
  question,
  nextPosition,
}: {
  courseId: string;
  examId: string;
  question?: AdminQuestion;
  nextPosition: number;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(saveQuestionAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="examId" value={examId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
        <div>
          <label className="label">Position</label>
          <input
            name="position"
            type="number"
            min={1}
            className="input"
            defaultValue={question?.position ?? nextPosition}
            required
          />
        </div>
        <div>
          <label className="label">Question</label>
          <textarea name="prompt" className="textarea min-h-20" defaultValue={question?.prompt} required />
        </div>
      </div>
      <div>
        <label className="label">Options (one per line, A–F)</label>
        <textarea
          name="options"
          className="textarea min-h-28 font-mono text-xs"
          defaultValue={question?.options.join("\n")}
          placeholder={"GET\nPOST\nDELETE\nHEAD"}
          required
        />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-32">
          <label className="label">Correct option</label>
          <select name="correct" className="select" defaultValue={question ? String.fromCharCode(65 + question.correctIndex) : "A"}>
            {["A", "B", "C", "D", "E", "F"].map((letter) => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
          </select>
        </div>
        <SubmitButton label={question ? "Update question" : "Add question"} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.message && <p className="text-xs text-[var(--success)]">{state.message}</p>}
    </form>
  );
}

export function ExamEditor({
  courseId,
  exam,
  questions,
}: {
  courseId: string;
  exam: Exam | null;
  questions: AdminQuestion[];
}) {
  return (
    <section className="admin-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Final exam</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {exam ? `${questions.length} questions · ${exam.timeLimitMin} min · pass ${exam.passScore}%` : "No exam configured yet."}
          </p>
        </div>
        <HelpCircle size={18} className="text-[var(--accent)]" />
      </div>

      <div className="mt-4">
        <ExamSettingsForm courseId={courseId} exam={exam} />
      </div>

      {exam && (
        <>
          <div className="divider my-4" />
          <div className="space-y-2">
            {questions.map((question) => (
              <details key={question.id} className="group rounded-xl border border-[var(--line)]">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[11px] font-bold text-[var(--accent)]">
                    {question.position}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{question.prompt}</span>
                  <span className="badge badge-success">{String.fromCharCode(65 + question.correctIndex)}</span>
                  <ChevronDown size={15} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-[var(--line)] p-3">
                  <QuestionForm
                    courseId={courseId}
                    examId={exam.id}
                    question={question}
                    nextPosition={question.position}
                  />
                  <form action={deleteQuestionAction} className="mt-3 flex justify-end border-t border-[var(--line)] pt-3">
                    <input type="hidden" name="id" value={question.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <ConfirmButton message="Delete this question?">
                      <Trash2 size={13} /> Delete question
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
            {questions.length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                No questions yet. Add the first one below.
              </p>
            )}
          </div>

          <details className="mt-4 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <Plus size={16} className="text-[var(--accent)]" /> Add a question
            </summary>
            <div className="border-t border-[var(--line)] p-3">
              <QuestionForm
                key={`add-question-${questions.length}`}
                courseId={courseId}
                examId={exam.id}
                nextPosition={questions.length + 1}
              />
            </div>
          </details>
        </>
      )}
    </section>
  );
}
