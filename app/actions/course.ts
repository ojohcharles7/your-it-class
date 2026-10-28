"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isEnrolled } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminRole, isTeacherRole } from "@/lib/roles";

export type QuestionState = { error?: string; message?: string };

export async function askCourseQuestionAction(_state: QuestionState, formData: FormData): Promise<QuestionState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Sign in to ask a question." };

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "") || null;
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!courseId || body.length < 2) return { error: "Write a question first." };
  if (body.length > 2000) return { error: "Keep your question under 2,000 characters." };
  if (!(await isEnrolled(current.id, courseId))) return { error: "Only enrolled learners can ask questions." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "The course discussion is not connected yet." };

  const { error } = await supabase.from("course_questions").insert({
    course_id: courseId,
    lesson_id: lessonId,
    user_id: current.id,
    body,
  });
  if (error) return { error: error.message };

  if (slug) revalidatePath(`/dashboard/courses/${slug}`);
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  return { message: "Question posted." };
}

export async function answerCourseQuestionAction(_state: QuestionState, formData: FormData): Promise<QuestionState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Sign in to answer." };

  const questionId = String(formData.get("questionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!questionId || !courseId || body.length < 2) return { error: "Write an answer first." };
  if (body.length > 2000) return { error: "Keep your answer under 2,000 characters." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "The course discussion is not connected yet." };

  const { error } = await supabase.from("course_answers").insert({
    question_id: questionId,
    user_id: current.id,
    body,
  });
  if (error) return { error: error.message };

  if (slug) revalidatePath(`/dashboard/courses/${slug}`);
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  return { message: "Answer posted." };
}

export async function resolveCourseQuestionAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || (!isTeacherRole(current.profile.role) && !isAdminRole(current.profile.role))) return;

  const questionId = String(formData.get("questionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const resolved = formData.get("resolved") === "true";
  if (!questionId || !courseId) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("course_questions")
    .update({
      resolved,
      resolved_by: resolved ? current.id : null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", questionId)
    .eq("course_id", courseId);
  if (error) return;

  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/dashboard/courses");
}

export async function deleteCourseAnswerAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;
  const answerId = String(formData.get("answerId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!answerId) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("course_answers").delete().eq("id", answerId).eq("user_id", current.id);
  if (courseId) revalidatePath(`/instructor/courses/${courseId}`);
}

export async function saveCourseAnnouncementAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || (!isTeacherRole(current.profile.role) && !isAdminRole(current.profile.role))) return;

  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!courseId || title.length < 2 || body.length < 2) return;

  const admin = createSupabaseAdminClient();
  const { data: course } = await admin.from("courses").select("instructor_id, slug").eq("id", courseId).maybeSingle();
  if (!course) return;
  if (!isAdminRole(current.profile.role) && course.instructor_id !== current.id) return;

  await admin.from("course_announcements").insert({
    course_id: courseId,
    created_by: current.id,
    title,
    body,
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/dashboard/courses/${course.slug}`);
}

export async function deleteCourseAnnouncementAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || (!isTeacherRole(current.profile.role) && !isAdminRole(current.profile.role))) return;

  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const admin = createSupabaseAdminClient();
  const { data: course } = await admin.from("courses").select("instructor_id, slug").eq("id", courseId).maybeSingle();
  if (!course) return;
  if (!isAdminRole(current.profile.role) && course.instructor_id !== current.id) return;

  await admin.from("course_announcements").delete().eq("id", id).eq("course_id", courseId);
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/dashboard/courses/${course.slug}`);
}
