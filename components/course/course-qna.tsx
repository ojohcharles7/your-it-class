"use client";

import { useActionState } from "react";
import { CheckCircle2, ChevronDown, Loader2, MessageCircleQuestion, Send } from "lucide-react";
import {
  answerCourseQuestionAction,
  askCourseQuestionAction,
  resolveCourseQuestionAction,
  type QuestionState,
} from "@/app/actions/course";
import type { CourseQuestion } from "@/lib/types";

const EMPTY: QuestionState = {};

function formatWhen(value: string) {
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function AnswerForm({ questionId, courseId, slug }: { questionId: string; courseId: string; slug: string }) {
  const [state, action, pending] = useActionState<QuestionState, FormData>(answerCourseQuestionAction, EMPTY);
  return (
    <form action={action} className="mt-2 flex items-start gap-2">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <input name="body" className="input h-9 flex-1 text-xs" placeholder="Write an answer…" maxLength={2000} required />
      <button type="submit" className="btn btn-sm" disabled={pending} aria-label="Post answer">
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
      </button>
      {state.error && <span className="text-[10px] text-[var(--danger)]">{state.error}</span>}
    </form>
  );
}

export function CourseQnA({
  courseId,
  slug,
  questions,
  currentUserId,
  canModerate = false,
}: {
  courseId: string;
  slug: string;
  questions: CourseQuestion[];
  currentUserId: string;
  canModerate?: boolean;
}) {
  const [state, action, pending] = useActionState<QuestionState, FormData>(askCourseQuestionAction, EMPTY);

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MessageCircleQuestion size={17} className="text-[var(--accent)]" /> Questions & answers
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Ask about a lesson and help other learners.</p>
        </div>
        <span className="badge badge-muted">{questions.length}</span>
      </div>

      <form action={action} className="mt-4 space-y-2">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <textarea name="body" className="input min-h-20" placeholder="What would you like to understand better?" maxLength={2000} required />
        <div className="flex items-center justify-between gap-2">
          {state.error ? (
            <p className="text-[11px] text-[var(--danger)]">{state.error}</p>
          ) : state.message ? (
            <p className="text-[11px] text-[var(--success)]">{state.message}</p>
          ) : (
            <span className="text-[11px] text-[var(--muted)]">Questions are visible to enrolled learners and your instructor.</span>
          )}
          <button type="submit" className="btn btn-primary btn-sm shrink-0" disabled={pending}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Ask question
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {questions.map((question) => (
          <details key={question.id} className="group rounded-xl border border-[var(--line)]">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                {(question.authorName || "Learner").split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold">{question.authorName || "Learner"}</span>
                  <span className="text-[10px] text-[var(--muted)]">{formatWhen(question.createdAt)}</span>
                  {question.resolved && <span className="badge badge-success"><CheckCircle2 size={10} /> Resolved</span>}
                </span>
                <span className="mt-1 block text-sm leading-relaxed">{question.body}</span>
                <span className="mt-1 block text-[10px] text-[var(--muted)]">
                  {question.answers.length} {question.answers.length === 1 ? "answer" : "answers"}
                </span>
              </span>
              <ChevronDown size={15} className="mt-1 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-[var(--line)] px-3 pb-3 pt-2">
              <div className="space-y-2">
                {question.answers.map((answer) => (
                  <div key={answer.id} className="rounded-lg bg-[var(--surface-2)] p-2.5">
                    <p className="text-[10px] font-semibold">
                      {answer.authorName || "Learner"}
                      <span className="ml-2 font-normal text-[var(--muted)]">{formatWhen(answer.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{answer.body}</p>
                  </div>
                ))}
              </div>
              {currentUserId && <AnswerForm questionId={question.id} courseId={courseId} slug={slug} />}
              {canModerate && (
                <form action={resolveCourseQuestionAction} className="mt-2 flex justify-end">
                  <input type="hidden" name="questionId" value={question.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="resolved" value={String(!question.resolved)} />
                  <button type="submit" className="btn btn-sm">
                    {question.resolved ? "Reopen question" : "Mark resolved"}
                  </button>
                </form>
              )}
            </div>
          </details>
        ))}
        {questions.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-[var(--muted)]">
            No questions yet. Start the discussion above.
          </p>
        )}
      </div>
    </section>
  );
}
