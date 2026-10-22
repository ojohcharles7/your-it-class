"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { getAdminUserEmails } from "@/lib/data";
import { isSupabaseAdminConfigured, isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminClient } from "@/lib/supabase/admin-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminRoleOptions } from "@/lib/roles";
import type { AdminActionState, Role } from "@/lib/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function youtubeId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : trimmed;
}

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Course title is required."),
  slug: z.string().trim().min(3, "Slug is required."),
  description: z.string().trim().min(10, "Add a short description."),
  category: z.string().trim().min(2, "Category is required."),
  level: z.string().trim().min(2),
  priceNaira: z.coerce.number().min(0, "Price cannot be negative."),
  hours: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5),
  emoji: z.string().trim().min(1, "Add an emoji."),
  gradientStart: z.string().trim().min(4),
  gradientEnd: z.string().trim().min(4),
  outcomes: z.string().optional(),
  published: z.string().optional(),
});

export async function saveCourseAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = courseSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level"),
    priceNaira: formData.get("priceNaira"),
    hours: formData.get("hours"),
    rating: formData.get("rating"),
    emoji: formData.get("emoji"),
    gradientStart: formData.get("gradientStart"),
    gradientEnd: formData.get("gradientEnd"),
    outcomes: formData.get("outcomes"),
    published: formData.get("published"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const admin = await getAdminClient();
  const values = {
    title: parsed.data.title,
    slug: slugify(parsed.data.slug),
    description: parsed.data.description,
    category: parsed.data.category,
    level: parsed.data.level,
    price_kobo: Math.round(parsed.data.priceNaira * 100),
    hours: parsed.data.hours,
    rating: parsed.data.rating,
    emoji: parsed.data.emoji,
    gradient: `${parsed.data.gradientStart},${parsed.data.gradientEnd}`,
    outcomes: (parsed.data.outcomes ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    published: parsed.data.published === "on",
  };

  if (parsed.data.id) {
    const { error } = await admin.from("courses").update(values).eq("id", parsed.data.id);
    if (error) return { error: error.message };
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${parsed.data.id}`);
    revalidatePath("/courses");
    revalidatePath(`/courses/${values.slug}`);
    revalidatePath("/");
    revalidateTag("catalog");
    return { message: "Course updated." };
  }

  const { data, error } = await admin.from("courses").insert(values).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidateTag("catalog");
  redirect(`/admin/courses/${data.id}?created=1`);
}

export async function deleteCourseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = await getAdminClient();
  await admin.from("courses").delete().eq("id", id);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidateTag("catalog");
  redirect("/admin/courses");
}

export async function toggleCoursePublishAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";
  if (!id) return;
  const admin = await getAdminClient();
  await admin.from("courses").update({ published }).eq("id", id);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidateTag("catalog");
}

const lessonSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  position: z.coerce.number().int().min(1),
  title: z.string().trim().min(3, "Lesson title is required."),
  youtubeId: z.string().trim().min(3, "Add a YouTube video ID or URL."),
  durationMin: z.coerce.number().int().min(1, "Duration must be at least 1 minute."),
  isFree: z.string().optional(),
});

export async function saveLessonAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = lessonSchema.safeParse({
    id: formData.get("id") || undefined,
    courseId: formData.get("courseId"),
    position: formData.get("position"),
    title: formData.get("title"),
    youtubeId: formData.get("youtubeId"),
    durationMin: formData.get("durationMin"),
    isFree: formData.get("isFree"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the lesson." };

  const admin = await getAdminClient();
  const values = {
    course_id: parsed.data.courseId,
    position: parsed.data.position,
    title: parsed.data.title,
    youtube_id: youtubeId(parsed.data.youtubeId),
    duration_min: parsed.data.durationMin,
    is_free: parsed.data.isFree === "on",
  };

  const { error } = parsed.data.id
    ? await admin.from("lessons").update(values).eq("id", parsed.data.id)
    : await admin.from("lessons").insert(values);
  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidateTag("catalog");
  return { message: parsed.data.id ? "Lesson updated." : "Lesson added." };
}

export async function deleteLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id) return;
  const admin = await getAdminClient();
  await admin.from("lessons").delete().eq("id", id);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidateTag("catalog");
}

const examSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3, "Exam title is required."),
  passScore: z.coerce.number().int().min(1).max(100),
  timeLimitMin: z.coerce.number().int().min(1).max(180),
});

export async function saveExamAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = examSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    passScore: formData.get("passScore"),
    timeLimitMin: formData.get("timeLimitMin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the exam settings." };

  const admin = await getAdminClient();
  const { error } = await admin.from("exams").upsert(
    {
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      pass_score: parsed.data.passScore,
      time_limit_min: parsed.data.timeLimitMin,
    },
    { onConflict: "course_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/dashboard");
  return { message: "Exam settings saved." };
}

const questionSchema = z.object({
  id: z.string().optional(),
  examId: z.string().min(1),
  courseId: z.string().min(1),
  prompt: z.string().trim().min(5, "Question prompt is required."),
  options: z.string().trim().min(3, "Add at least two options."),
  correct: z.string().trim().min(1),
  position: z.coerce.number().int().min(1),
});

export async function saveQuestionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = questionSchema.safeParse({
    id: formData.get("id") || undefined,
    examId: formData.get("examId"),
    courseId: formData.get("courseId"),
    prompt: formData.get("prompt"),
    options: formData.get("options"),
    correct: formData.get("correct"),
    position: formData.get("position"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the question." };

  const options = parsed.data.options
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (options.length < 2) return { error: "Add at least two options, one per line." };

  const correctIndex = ["A", "B", "C", "D", "E", "F"].indexOf(parsed.data.correct.toUpperCase());
  if (correctIndex < 0 || correctIndex >= options.length) return { error: "Correct answer must match one of the options." };

  const admin = await getAdminClient();
  const values = {
    exam_id: parsed.data.examId,
    prompt: parsed.data.prompt,
    options,
    correct_index: correctIndex,
    position: parsed.data.position,
  };

  const { error } = parsed.data.id
    ? await admin.from("exam_questions").update(values).eq("id", parsed.data.id)
    : await admin.from("exam_questions").insert(values);
  if (error) return { error: error.message };

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/dashboard");
  return { message: parsed.data.id ? "Question updated." : "Question added." };
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id) return;
  const admin = await getAdminClient();
  await admin.from("exam_questions").delete().eq("id", id);
  revalidatePath(`/admin/courses/${courseId}`);
}

const assignableRoles = new Set<Role>(adminRoleOptions.map((option) => option.value));

export async function setRoleAction(formData: FormData) {
  const current = await requireSuperAdmin();
  const userId = String(formData.get("userId") ?? "");
  const requested = String(formData.get("role") ?? "") as Role;
  const role = assignableRoles.has(requested) ? requested : "student";
  if (!userId || userId === current.id) return;

  // Use the super admin's own session so the role-protection trigger can verify access.
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("profiles").update({ role }).eq("id", userId);
  if (role !== "teacher") {
    await supabase.from("course_teachers").delete().eq("teacher_id", userId);
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin/teachers");
}

const teacherSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the teacher's full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function createTeacherAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireSuperAdmin();

  if (!isSupabaseConfigured) {
    return { error: "Supabase is not connected yet. Add your project keys to .env.local and restart the app." };
  }

  const parsed = teacherSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the teacher details." };

  const email = parsed.data.email.toLowerCase();
  const fullName = parsed.data.fullName;

  if (isSupabaseAdminConfigured) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not create the teacher account." };

    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id: data.user.id, full_name: fullName, role: "teacher" }, { onConflict: "id" });
    if (profileError) return { error: profileError.message };

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/students");
    return { message: `${email} can now log in and teach.` };
  }

  const publicClient = createSupabasePublicClient();
  if (!publicClient) return { error: "Supabase is not connected yet." };

  const { data, error } = await publicClient.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/teacher")}`,
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create the teacher account." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "teacher", full_name: fullName })
    .eq("id", data.user.id);
  if (profileError) {
    return { error: `Account created, but the teacher role could not be set: ${profileError.message}` };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
  return {
    message: data.session
      ? `${email} can now log in and teach. Assign their classes below.`
      : `Teacher account created. Ask ${email} to confirm the email, then log in at /teacher.`,
  };
}

export async function promoteTeacherAction(formData: FormData) {
  const current = await requireSuperAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const directory = await getAdminUserEmails();
  const match = [...directory.entries()].find(([, value]) => value.toLowerCase() === email);
  if (!match || match[0] === current.id) redirect("/admin/teachers?error=notfound");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("profiles").update({ role: "teacher" }).eq("id", match[0]);
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
  redirect("/admin/teachers?added=1");
}

export async function assignTeacherCoursesAction(formData: FormData) {
  await requireSuperAdmin();
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId) return;

  const courseIds = Array.from(new Set(formData.getAll("courseIds").map(String).filter(Boolean)));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("course_teachers").delete().eq("teacher_id", teacherId);
  if (courseIds.length) {
    await supabase
      .from("course_teachers")
      .insert(courseIds.map((courseId) => ({ course_id: courseId, teacher_id: teacherId })));
  }
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
  revalidatePath("/teacher");
}

export async function removeTeacherAction(formData: FormData) {
  const current = await requireSuperAdmin();
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId || teacherId === current.id) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("course_teachers").delete().eq("teacher_id", teacherId);
  await supabase.from("profiles").update({ role: "student" }).eq("id", teacherId);
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
}
