import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { ExamRunner } from "@/components/dashboard/exam-runner";
import { requireUser } from "@/lib/auth";
import { getExamWithCourse, getLearningCourse } from "@/lib/data";
import { getOrCreateExamSession } from "@/lib/exam-sessions";

export const metadata: Metadata = { title: "Final exam" };
export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await requireUser(`/dashboard/exams/${id}`);

  const data = await getExamWithCourse(id);
  if (!data) notFound();

  const learning = await getLearningCourse(current.id, data.course.slug);
  if (!learning) redirect(`/courses/${data.course.slug}`);

  if (learning.progress < 100) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="glass p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]">
            <Lock size={26} />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight">This exam is still locked</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            Complete all lessons in <strong>{data.course.title}</strong> to unlock the final exam. You are currently at{" "}
            {learning.progress}%.
          </p>
          <Link href={`/dashboard/courses/${data.course.slug}`} className="btn btn-primary mt-5">
            Continue course
          </Link>
        </div>
      </div>
    );
  }

  const session = await getOrCreateExamSession(current.id, data.exam.id, data.exam.timeLimitMin);

  return (
    <ExamRunner
      examId={data.exam.id}
      sessionId={session?.id ?? null}
      secondsRemaining={session?.secondsRemaining ?? data.exam.timeLimitMin * 60}
      courseTitle={data.course.title}
      courseSlug={data.course.slug}
      passScore={data.exam.passScore}
      questions={data.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      }))}
    />
  );
}
