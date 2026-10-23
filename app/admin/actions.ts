"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { courseInputSchema, slugify, youtubeId } from "@/lib/course-input";
import { COURSE_MATERIALS_BUCKET, COURSE_VIDEOS_BUCKET, getAdminUserEmails } from "@/lib/data";
import { isSupabaseAdminConfigured, isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminClient } from "@/lib/supabase/admin-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminRoleOptions } from "@/lib/roles";
import type { AdminActionState, Role } from "@/lib/types";
import {
  MAX_RESOURCE_BYTES,
  MAX_VIDEO_BYTES,
  allowedResourceExtensions,
  allowedVideoExtensions,
  allowedVideoTypes,
  resourceContentType,
} from "@/lib/uploads";

const courseSchema = courseInputSchema;

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
  youtubeId: z.string().trim().optional(),
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

  const keepVideo = formData.get("keepVideo") === "on";
  if (!keepVideo && !parsed.data.youtubeId) return { error: "Add a YouTube video ID or URL." };

  const admin = await getAdminClient();
  const values = {
    course_id: parsed.data.courseId,
    position: parsed.data.position,
    title: parsed.data.title,
    duration_min: parsed.data.durationMin,
    is_free: parsed.data.isFree === "on",
    ...(keepVideo ? {} : { youtube_id: youtubeId(parsed.data.youtubeId ?? "") }),
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
  revalidatePath("/admin/content");
  revalidatePath("/courses");
  revalidateTag("catalog");
}

const adminLessonInputSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  position: z.coerce.number().int().min(1),
  title: z.string().trim().min(3, "Lesson title is required."),
  youtubeId: z.string().trim().optional(),
  durationMin: z.coerce.number().int().min(1, "Duration must be at least 1 minute."),
  isFree: z.boolean().optional(),
  videoPath: z.string().trim().optional(),
  videoMime: z.string().trim().optional(),
  videoSize: z.coerce.number().optional(),
  keepVideo: z.boolean().optional(),
});

export type AdminLessonInput = z.input<typeof adminLessonInputSchema>;

function revalidateAdminContent(courseId: string, slug?: string) {
  revalidatePath("/admin/content");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidateTag("catalog");
  if (slug) revalidatePath(`/courses/${slug}`);
}

export async function saveAdminLessonAction(input: AdminLessonInput): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = adminLessonInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the lesson." };

  const data = parsed.data;
  const admin = await getAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, slug")
    .eq("id", data.courseId)
    .maybeSingle();
  if (!course) return { error: "That class could not be found." };

  const videoPath = data.videoPath?.trim() || "";
  const youtube = data.youtubeId?.trim() || "";

  let videoValues: {
    youtube_id?: string;
    video_path?: string | null;
    video_mime?: string | null;
    video_size?: number | null;
  };

  if (videoPath) {
    if (!videoPath.startsWith(`${data.courseId}/`) || videoPath.includes("..")) {
      return { error: "That video upload is not valid. Try again." };
    }
    if (!Number.isFinite(data.videoSize ?? 0) || (data.videoSize ?? 0) <= 0 || (data.videoSize ?? 0) > MAX_VIDEO_BYTES) {
      return { error: "Videos must be 500 MB or smaller." };
    }
    if (data.videoMime && !allowedVideoTypes.has(data.videoMime)) {
      return { error: "Upload an MP4, WebM, OGG, MOV or M4V video." };
    }
    videoValues = {
      youtube_id: "",
      video_path: videoPath,
      video_mime: data.videoMime || "video/mp4",
      video_size: data.videoSize ?? null,
    };
  } else if (youtube) {
    videoValues = { youtube_id: youtubeId(youtube), video_path: null, video_mime: null, video_size: null };
  } else if (data.keepVideo) {
    videoValues = {};
  } else {
    return { error: "Upload a video file or add a YouTube video ID." };
  }

  const values = {
    course_id: data.courseId,
    position: data.position,
    title: data.title,
    duration_min: data.durationMin,
    is_free: data.isFree ?? false,
    ...videoValues,
  };

  if (data.id) {
    const { data: existing } = await admin
      .from("lessons")
      .select("id, video_path")
      .eq("id", data.id)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!existing) return { error: "That lesson could not be found." };

    const { error } = await admin.from("lessons").update(values).eq("id", data.id);
    if (error) return { error: error.message };

    const oldPath = (existing as { video_path?: string | null }).video_path;
    if (oldPath && oldPath !== videoPath && !data.keepVideo) {
      await admin.storage.from(COURSE_VIDEOS_BUCKET).remove([oldPath]);
    }
  } else {
    const { error } = await admin.from("lessons").insert(values);
    if (error) return { error: error.message };
  }

  revalidateAdminContent(data.courseId, (course as { slug: string }).slug);
  return { message: data.id ? "Lesson updated." : "Lesson added." };
}

export async function deleteAdminLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const admin = await getAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("video_path")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();

  await admin.from("lessons").delete().eq("id", id).eq("course_id", courseId);
  const videoPath = (lesson as { video_path?: string | null } | null)?.video_path;
  if (videoPath) await admin.storage.from(COURSE_VIDEOS_BUCKET).remove([videoPath]);

  revalidateAdminContent(courseId);
  redirect(`/admin/content?course=${courseId}&lessonDeleted=1`);
}

export async function prepareAdminVideoUploadAction(input: {
  courseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<{ error?: string; path?: string; token?: string }> {
  await requireAdmin();
  const courseId = String(input.courseId ?? "");
  const fileName = String(input.fileName ?? "").trim();
  const fileType = String(input.fileType ?? "");
  const fileSize = Number(input.fileSize);

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedVideoExtensions.has(ext)) return { error: "Upload an MP4, WebM, OGG, MOV or M4V video." };
  if (fileType && !allowedVideoTypes.has(fileType)) return { error: "Upload an MP4, WebM, OGG, MOV or M4V video." };
  if (!Number.isFinite(fileSize) || fileSize <= 0) return { error: "That video file looks empty." };
  if (fileSize > MAX_VIDEO_BYTES) return { error: "Videos must be 500 MB or smaller." };

  const admin = await getAdminClient();
  const { data: course } = await admin.from("courses").select("id").eq("id", courseId).maybeSingle();
  if (!course) return { error: "That class could not be found." };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || `lesson.${ext}`;
  const path = `${courseId}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await admin.storage.from(COURSE_VIDEOS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };
  return { path: data.path, token: data.token };
}

export type ResourceUploadTarget = {
  error?: string;
  path?: string;
  token?: string;
};

export async function prepareResourceUploadAction(input: {
  courseId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<ResourceUploadTarget> {
  await requireAdmin();

  const courseId = String(input.courseId ?? "");
  const title = String(input.title ?? "").trim();
  const fileName = String(input.fileName ?? "").trim();
  const fileSize = Number(input.fileSize);

  if (!courseId) return { error: "Choose a class first." };
  if (title.length < 2) return { error: "Give this document a title." };

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedResourceExtensions.has(ext)) {
    return { error: "Only PDF, DOC, DOCX and EPUB files can be uploaded." };
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) return { error: "That file looks empty." };
  if (fileSize > MAX_RESOURCE_BYTES) return { error: "Files must be 50 MB or smaller." };

  const admin = await getAdminClient();
  const { data: course } = await admin.from("courses").select("id").eq("id", courseId).maybeSingle();
  if (!course) return { error: "That class could not be found." };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "handout." + ext;
  const path = `${courseId}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await admin.storage.from(COURSE_MATERIALS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };

  return { path: data.path, token: data.token };
}

export async function saveResourceUploadAction(input: {
  courseId: string;
  title: string;
  path: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<AdminActionState> {
  const current = await requireAdmin();

  const courseId = String(input.courseId ?? "");
  const title = String(input.title ?? "").trim();
  const path = String(input.path ?? "");
  const fileName = String(input.fileName ?? "");
  const fileSize = Number(input.fileSize);

  if (current.id === "local-admin") return { error: "Connect Supabase before uploading class files." };
  if (!courseId || !path.startsWith(`${courseId}/`) || path.includes("..")) {
    return { error: "That upload is not valid. Try again." };
  }
  if (title.length < 2) return { error: "Give this document a title." };

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedResourceExtensions.has(ext)) return { error: "Only PDF, DOC, DOCX and EPUB files can be uploaded." };
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_RESOURCE_BYTES) {
    return { error: "Files must be 50 MB or smaller." };
  }

  const admin = await getAdminClient();
  const { error } = await admin.from("course_resources").insert({
    course_id: courseId,
    title,
    storage_path: path,
    file_name: fileName,
    mime_type: resourceContentType(fileName, String(input.fileType ?? "")),
    size_bytes: fileSize,
    created_by: current.id,
  });
  if (error) {
    await admin.storage.from(COURSE_MATERIALS_BUCKET).remove([path]);
    return { error: error.message };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/dashboard");
  return { message: `${title} added to the class.` };
}

export async function deleteResourceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = await getAdminClient();
  const { data: resource } = await admin
    .from("course_resources")
    .select("storage_path, course_id")
    .eq("id", id)
    .maybeSingle();
  if (!resource) return;

  await admin.storage.from(COURSE_MATERIALS_BUCKET).remove([resource.storage_path]);
  await admin.from("course_resources").delete().eq("id", id);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/courses/${resource.course_id}`);
  revalidatePath("/dashboard");
  redirect(`/admin/content?course=${resource.course_id}&deleted=1`);
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
    await supabase.from("instructor_profiles").update({ is_public: false }).eq("user_id", userId);
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin/teachers");
  revalidatePath("/master/users");
  revalidatePath("/master/instructors");
  revalidatePath("/instructors");
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
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/instructor")}`,
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
      : `Instructor account created. Ask ${email} to confirm the email, then log in at /instructor.`,
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
  await requireAdmin();
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId) return;

  const courseIds = Array.from(new Set(formData.getAll("courseIds").map(String).filter(Boolean)));
  const admin = await getAdminClient();

  await admin.from("course_teachers").delete().eq("teacher_id", teacherId);
  if (courseIds.length) {
    await admin
      .from("course_teachers")
      .insert(courseIds.map((courseId) => ({ course_id: courseId, teacher_id: teacherId })));
  }
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
  revalidatePath("/instructor");
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
