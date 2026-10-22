"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getExamWithCourse } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { serialFor } from "@/lib/utils";
import { clearExamSession, validateExamSession } from "@/lib/exam-sessions";

export type ExamResultState = {
  error?: string;
  score?: number;
  total?: number;
  percent?: number;
  passed?: boolean;
  certificateSerial?: string;
};

const submissionSchema = z.object({
  examId: z.string().min(1),
  sessionId: z.string().min(1),
  answers: z.record(z.string(), z.coerce.number().int().min(0)),
});

export async function submitExamAction(_state: ExamResultState, formData: FormData): Promise<ExamResultState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Your session expired. Log in and try again." };
  if (!isSupabaseAdminConfigured) return { error: "Exams are not connected yet." };

  let answers: Record<string, number> = {};
  try {
    answers = JSON.parse(String(formData.get("answers") ?? "{}")) as Record<string, number>;
  } catch {
    return { error: "Could not read your answers. Please try again." };
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    return { error: "Your exam session has expired. Reload the page to start a fresh timed attempt." };
  }

  const parsed = submissionSchema.safeParse({ examId: formData.get("examId"), sessionId, answers });
  if (!parsed.success) return { error: "Invalid submission." };

  const data = await getExamWithCourse(parsed.data.examId);
  if (!data || !data.questions.length) return { error: "This exam is not available." };

  const sessionState = await validateExamSession(
    current.id,
    data.exam.id,
    parsed.data.sessionId,
    data.exam.timeLimitMin,
  );
  if (sessionState === "expired") {
    return { error: "Time is up. This attempt was not saved — reload the page to start a fresh timed attempt." };
  }
  if (sessionState === "missing") {
    return { error: "Your exam session is invalid. Reload the page to start again." };
  }

  const admin = createSupabaseAdminClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", current.id)
    .eq("course_id", data.course.id)
    .maybeSingle();
  if (!enrollment) return { error: "You are not enrolled in this course." };

  const { data: courseLessons } = await admin.from("lessons").select("id").eq("course_id", data.course.id);
  const lessonIds = (courseLessons ?? []).map((lesson) => lesson.id as string);

  const { count: completedCount } = lessonIds.length
    ? await admin
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", current.id)
        .in("lesson_id", lessonIds)
    : { count: 0 };

  if (lessonIds.length === 0 || completedCount !== lessonIds.length) {
    return { error: "Complete every lesson in this course before taking the final exam." };
  }

  let score = 0;
  const safeAnswers: Record<string, number> = {};
  for (const question of data.questions) {
    const selected = parsed.data.answers[question.id];
    if (typeof selected === "number" && selected >= 0 && selected < question.options.length) {
      safeAnswers[question.id] = selected;
      if (selected === question.correctIndex) score += 1;
    }
  }

  const total = data.questions.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= data.exam.passScore;

  const { error: attemptError } = await admin.from("exam_attempts").insert({
    user_id: current.id,
    exam_id: data.exam.id,
    score,
    total,
    passed,
    answers: safeAnswers,
  });
  if (attemptError) return { error: attemptError.message };

  await clearExamSession(current.id, data.exam.id);

  let certificateSerial: string | undefined;

  if (passed) {
    const { data: existing } = await admin
      .from("certificates")
      .select("serial")
      .eq("user_id", current.id)
      .eq("course_id", data.course.id)
      .maybeSingle();

    if (existing?.serial) {
      certificateSerial = existing.serial as string;
    } else {
      const { data: certificate } = await admin
        .from("certificates")
        .insert({
          user_id: current.id,
          course_id: data.course.id,
          serial: serialFor(data.course.slug),
        })
        .select("serial")
        .maybeSingle();
      certificateSerial = certificate?.serial;
    }

    await admin.from("enrollments").update({ status: "completed" }).eq("id", enrollment.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/exams");
  revalidatePath("/dashboard/certificates");
  revalidatePath(`/dashboard/courses/${data.course.slug}`);

  return { score, total, percent, passed, certificateSerial };
}
