"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireInstructor } from "@/lib/auth";
import { courseInputSchema, slugify, youtubeId } from "@/lib/course-input";
import { COURSE_MATERIALS_BUCKET, COURSE_VIDEOS_BUCKET } from "@/lib/data";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminActionState } from "@/lib/types";
import {
  MAX_RESOURCE_BYTES,
  MAX_VIDEO_BYTES,
  allowedResourceExtensions,
  allowedVideoExtensions,
  allowedVideoTypes,
  resourceContentType,
} from "@/lib/uploads";

async function writeClient(): Promise<SupabaseClient> {
  if (isSupabaseAdminConfigured) return createSupabaseAdminClient();
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

function dbError(error: { message: string; code?: string }) {
  if (error.code === "42703" || error.code === "PGRST204") {
    return "The instructor platform database changes are missing. Run supabase/migrations/20261024000000_instructor_platform.sql in Supabase, then try again.";
  }
  return error.message;
}

async function ownedCourse(client: SupabaseClient, instructorId: string, courseId: string) {
  const { data } = await client
    .from("courses")
    .select("id, slug, title, instructor_id, review_status, published")
    .eq("id", courseId)
    .maybeSingle();
  if (!data || data.instructor_id !== instructorId) return null;
  return data as {
    id: string;
    slug: string;
    title: string;
    instructor_id: string;
    review_status: string;
    published: boolean;
  };
}

function revalidateInstructor(courseId?: string, slug?: string) {
  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath("/instructor/earnings");
  revalidatePath("/instructor/payouts");
  revalidatePath("/instructor/students");
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidateTag("catalog");
  if (courseId) {
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}`);
  }
  if (slug) {
    revalidatePath(`/courses/${slug}`);
    revalidatePath(`/instructors/${slug}`);
  }
}

function profileSlug(base: string, fallback: string) {
  return slugify(base || fallback) || `instructor-${fallback.slice(0, 8)}`;
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  slug: z.string().trim().optional(),
  headline: z.string().trim().max(140).optional(),
  bio: z.string().trim().max(3000).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  avatarUrl: z.string().trim().max(1000).optional(),
  expertise: z.string().optional(),
  isPublic: z.string().optional(),
  bankName: z.string().trim().max(100).optional(),
  accountName: z.string().trim().max(120).optional(),
  accountNumber: z.string().trim().max(40).optional(),
});

export async function saveInstructorProfileAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const current = await requireInstructor();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    slug: formData.get("slug") || undefined,
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
    expertise: formData.get("expertise") || undefined,
    isPublic: formData.get("isPublic") || undefined,
    bankName: formData.get("bankName") || undefined,
    accountName: formData.get("accountName") || undefined,
    accountNumber: formData.get("accountNumber") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the profile details." };

  const client = await writeClient();
  const { data: existing } = await client
    .from("instructor_profiles")
    .select("slug")
    .eq("user_id", current.id)
    .maybeSingle();

  const slug = profileSlug(parsed.data.slug ?? "", existing?.slug ?? parsed.data.fullName);
  const values = {
    user_id: current.id,
    slug,
    headline: parsed.data.headline ?? "",
    bio: parsed.data.bio ?? "",
    phone: parsed.data.phone ?? "",
    website: parsed.data.website ?? "",
    avatar_url: parsed.data.avatarUrl || null,
    expertise: (parsed.data.expertise ?? "")
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12),
    is_public: parsed.data.isPublic === "on",
    bank_name: parsed.data.bankName ?? "",
    account_name: parsed.data.accountName ?? "",
    account_number: parsed.data.accountNumber ?? "",
  };

  const { error } = await client.from("instructor_profiles").upsert(values, { onConflict: "user_id" });
  if (error) return { error: dbError(error) };

  const { error: profileError } = await client
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      bio: parsed.data.bio ?? "",
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", current.id);
  if (profileError) return { error: dbError(profileError) };

  revalidateInstructor(undefined, slug);
  return { message: "Instructor profile saved." };
}

export async function saveInstructorCourseAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const current = await requireInstructor();
  const parsed = courseInputSchema.safeParse({
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the course details." };

  const client = await writeClient();
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
  };

  if (parsed.data.id) {
    const owned = await ownedCourse(client, current.id, parsed.data.id);
    if (!owned) return { error: "You can only edit courses you own." };

    const { error } = await client.from("courses").update(values).eq("id", parsed.data.id);
    if (error) return { error: dbError(error) };
    revalidateInstructor(parsed.data.id, values.slug);
    return { message: "Course details saved." };
  }

  const { data, error } = await client
    .from("courses")
    .insert({
      ...values,
      instructor_id: current.id,
      review_status: "draft",
      published: false,
    })
    .select("id")
    .single();
  if (error) return { error: dbError(error) };

  revalidateInstructor(data.id, values.slug);
  redirect(`/instructor/courses/${data.id}?created=1`);
}

export async function submitInstructorCourseAction(formData: FormData) {
  const current = await requireInstructor();
  const courseId = String(formData.get("id") ?? "");
  if (!courseId) return;

  if (!isSupabaseAdminConfigured) {
    redirect(`/instructor/courses/${courseId}?error=service-role`);
  }

  const admin = createSupabaseAdminClient();
  const owned = await ownedCourse(admin, current.id, courseId);
  if (!owned) redirect("/instructor/courses");

  const { error } = await admin
    .from("courses")
    .update({
      review_status: "pending",
      published: false,
      submitted_at: new Date().toISOString(),
      review_note: "",
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq("id", courseId);

  revalidateInstructor(courseId, owned.slug);
  redirect(
    `/instructor/courses/${courseId}?${error ? `error=${encodeURIComponent(error.message)}` : "submitted=1"}`,
  );
}

export async function deleteInstructorCourseAction(formData: FormData) {
  const current = await requireInstructor();
  const courseId = String(formData.get("id") ?? "");
  if (!courseId) return;
  const client = await writeClient();
  const owned = await ownedCourse(client, current.id, courseId);
  if (!owned) redirect("/instructor/courses");

  await client.from("courses").delete().eq("id", courseId);
  revalidateInstructor();
  redirect("/instructor/courses?deleted=1");
}

// =========================================================
// Lessons
// =========================================================
const lessonSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  moduleId: z.string().trim().optional().nullable(),
  position: z.coerce.number().int().min(1),
  title: z.string().trim().min(3, "Lesson title is required."),
  youtubeId: z.string().trim().optional().default(""),
  durationMin: z.coerce.number().int().min(1, "Duration must be at least 1 minute."),
  isFree: z.boolean().optional().default(false),
  videoPath: z.string().trim().optional().nullable(),
  videoMime: z.string().trim().optional().nullable(),
  videoSize: z.coerce.number().optional().nullable(),
  keepVideo: z.boolean().optional().default(false),
});

export type InstructorLessonInput = z.input<typeof lessonSchema>;

export async function saveInstructorLessonAction(input: InstructorLessonInput): Promise<AdminActionState> {
  const current = await requireInstructor();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the lesson." };

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, parsed.data.courseId))) {
    return { error: "You can only add lessons to courses you own." };
  }

  const data = parsed.data;
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
    module_id: data.moduleId || null,
    position: data.position,
    title: data.title,
    duration_min: data.durationMin,
    is_free: data.isFree,
    ...videoValues,
  };

  if (data.id) {
    const { data: existing } = await client
      .from("lessons")
      .select("id, course_id, video_path")
      .eq("id", data.id)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (!existing) return { error: "That lesson could not be found." };

    const { error } = await client.from("lessons").update(values).eq("id", data.id);
    if (error) return { error: dbError(error) };

    const oldPath = (existing as { video_path?: string | null }).video_path;
    if (oldPath && oldPath !== videoPath && !data.keepVideo) {
      await client.storage.from(COURSE_VIDEOS_BUCKET).remove([oldPath]);
    }
  } else {
    const { error } = await client.from("lessons").insert(values);
    if (error) return { error: dbError(error) };
  }

  revalidateInstructor(data.courseId);
  return { message: data.id ? "Lesson updated." : "Lesson added." };
}

export async function deleteInstructorLessonAction(formData: FormData) {
  const current = await requireInstructor();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) redirect("/instructor/courses");

  const { data: lesson } = await client
    .from("lessons")
    .select("video_path")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();

  await client.from("lessons").delete().eq("id", id).eq("course_id", courseId);
  const videoPath = (lesson as { video_path?: string | null } | null)?.video_path;
  if (videoPath) await client.storage.from(COURSE_VIDEOS_BUCKET).remove([videoPath]);

  revalidateInstructor(courseId);
  redirect(`/instructor/courses/${courseId}?deleted=1`);
}

export type InstructorVideoTarget = {
  error?: string;
  path?: string;
  token?: string;
};

export async function prepareInstructorVideoUploadAction(input: {
  courseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<InstructorVideoTarget> {
  const current = await requireInstructor();
  const courseId = String(input.courseId ?? "");
  const fileName = String(input.fileName ?? "").trim();
  const fileType = String(input.fileType ?? "");
  const fileSize = Number(input.fileSize);

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) {
    return { error: "You can only upload videos to courses you own." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedVideoExtensions.has(ext)) return { error: "Upload an MP4, WebM, OGG, MOV or M4V video." };
  if (fileType && !allowedVideoTypes.has(fileType)) return { error: "Upload an MP4, WebM, OGG, MOV or M4V video." };
  if (!Number.isFinite(fileSize) || fileSize <= 0) return { error: "That video file looks empty." };
  if (fileSize > MAX_VIDEO_BYTES) return { error: "Videos must be 500 MB or smaller." };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || `lesson.${ext}`;
  const path = `${courseId}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await client.storage.from(COURSE_VIDEOS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { error: error?.message ?? "Could not start the upload. Apply the course-videos migration first." };
  }
  return { path: data.path, token: data.token };
}

// =========================================================
// Course resources
// =========================================================
export async function prepareInstructorResourceUploadAction(input: {
  courseId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<InstructorVideoTarget> {
  const current = await requireInstructor();
  const courseId = String(input.courseId ?? "");
  const title = String(input.title ?? "").trim();
  const fileName = String(input.fileName ?? "").trim();
  const fileSize = Number(input.fileSize);

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) return { error: "You can only add files to courses you own." };
  if (title.length < 2) return { error: "Give this document a title." };

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedResourceExtensions.has(ext)) return { error: "Only PDF, DOC, DOCX and EPUB files can be uploaded." };
  if (!Number.isFinite(fileSize) || fileSize <= 0) return { error: "That file looks empty." };
  if (fileSize > MAX_RESOURCE_BYTES) return { error: "Files must be 50 MB or smaller." };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || `handout.${ext}`;
  const path = `${courseId}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await client.storage.from(COURSE_MATERIALS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };
  return { path: data.path, token: data.token };
}

export async function saveInstructorResourceUploadAction(input: {
  courseId: string;
  title: string;
  path: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<AdminActionState> {
  const current = await requireInstructor();
  const courseId = String(input.courseId ?? "");
  const title = String(input.title ?? "").trim();
  const path = String(input.path ?? "");
  const fileName = String(input.fileName ?? "");
  const fileSize = Number(input.fileSize);

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) return { error: "You can only add files to courses you own." };
  if (!path.startsWith(`${courseId}/`) || path.includes("..")) return { error: "That upload is not valid. Try again." };
  if (title.length < 2) return { error: "Give this document a title." };

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedResourceExtensions.has(ext)) return { error: "Only PDF, DOC, DOCX and EPUB files can be uploaded." };
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_RESOURCE_BYTES) {
    return { error: "Files must be 50 MB or smaller." };
  }

  const { error } = await client.from("course_resources").insert({
    course_id: courseId,
    title,
    storage_path: path,
    file_name: fileName,
    mime_type: resourceContentType(fileName, String(input.fileType ?? "")),
    size_bytes: fileSize,
    created_by: current.id,
  });
  if (error) {
    await client.storage.from(COURSE_MATERIALS_BUCKET).remove([path]);
    return { error: dbError(error) };
  }

  revalidateInstructor(courseId);
  return { message: `${title} added to the course.` };
}

export async function deleteInstructorResourceAction(formData: FormData) {
  const current = await requireInstructor();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) redirect("/instructor/courses");

  const { data: resource } = await client
    .from("course_resources")
    .select("storage_path")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!resource) return;

  await client.storage.from(COURSE_MATERIALS_BUCKET).remove([resource.storage_path]);
  await client.from("course_resources").delete().eq("id", id);
  revalidateInstructor(courseId);
  redirect(`/instructor/courses/${courseId}?deleted=1`);
}

// =========================================================
// Exams
// =========================================================
const examSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3, "Exam title is required."),
  passScore: z.coerce.number().int().min(1).max(100),
  timeLimitMin: z.coerce.number().int().min(1).max(180),
});

export async function saveInstructorExamAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const current = await requireInstructor();
  const parsed = examSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    passScore: formData.get("passScore"),
    timeLimitMin: formData.get("timeLimitMin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the exam settings." };

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, parsed.data.courseId))) {
    return { error: "You can only edit exams for courses you own." };
  }

  const { error } = await client.from("exams").upsert(
    {
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      pass_score: parsed.data.passScore,
      time_limit_min: parsed.data.timeLimitMin,
    },
    { onConflict: "course_id" },
  );
  if (error) return { error: dbError(error) };
  revalidateInstructor(parsed.data.courseId);
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

export async function saveInstructorQuestionAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const current = await requireInstructor();
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
  if (correctIndex < 0 || correctIndex >= options.length) {
    return { error: "Correct answer must match one of the options." };
  }

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, parsed.data.courseId))) {
    return { error: "You can only edit exams for courses you own." };
  }

  const values = {
    exam_id: parsed.data.examId,
    prompt: parsed.data.prompt,
    options,
    correct_index: correctIndex,
    position: parsed.data.position,
  };

  const { error } = parsed.data.id
    ? await client.from("exam_questions").update(values).eq("id", parsed.data.id)
    : await client.from("exam_questions").insert(values);
  if (error) return { error: dbError(error) };

  revalidateInstructor(parsed.data.courseId);
  return { message: parsed.data.id ? "Question updated." : "Question added." };
}

export async function deleteInstructorQuestionAction(formData: FormData) {
  const current = await requireInstructor();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const client = await writeClient();
  if (!(await ownedCourse(client, current.id, courseId))) redirect("/instructor/courses");
  await client.from("exam_questions").delete().eq("id", id);
  revalidateInstructor(courseId);
}

// =========================================================
// Payouts
// =========================================================
export async function requestPayoutAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireInstructor();
  const amountNaira = Number(formData.get("amountNaira"));
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
    return { error: "Enter a valid payout amount." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected." };

  const { error } = await supabase.rpc("request_payout", {
    p_amount_kobo: Math.round(amountNaira * 100),
    p_note: note,
  });
  if (error) return { error: error.message };

  revalidateInstructor();
  return { message: "Payout request submitted for review." };
}

// =========================================================
// Modules
// =========================================================
const moduleSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  title: z.string().trim().min(2, "Module title is required.").max(160),
  position: z.coerce.number().int().min(1),
});

export async function saveInstructorModuleAction(formData: FormData) {
  const current = await requireInstructor();
  const parsed = moduleSchema.safeParse({
    id: formData.get("id") || undefined,
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    position: formData.get("position"),
  });
  if (!parsed.success) {
    redirect(`/instructor/courses/${String(formData.get("courseId") ?? "")}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the module.")}`);
  }

  const client = await writeClient();
  const course = await ownedCourse(client, current.id, parsed.data.courseId);
  if (!course) redirect("/instructor/courses");

  const values = {
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    position: parsed.data.position,
  };
  const { error } = parsed.data.id
    ? await client.from("course_modules").update(values).eq("id", parsed.data.id)
    : await client.from("course_modules").insert(values);

  const revalidate = () => {
    revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/courses");
    revalidateTag("catalog");
  };
  if (error) {
    redirect(`/instructor/courses/${parsed.data.courseId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidate();
  redirect(`/instructor/courses/${parsed.data.courseId}?moduleSaved=1`);
}

export async function deleteInstructorModuleAction(formData: FormData) {
  const current = await requireInstructor();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!id || !courseId) return;

  const client = await writeClient();
  const course = await ownedCourse(client, current.id, courseId);
  if (!course) redirect("/instructor/courses");

  await client.from("course_modules").delete().eq("id", id).eq("course_id", courseId);
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/courses/${course.slug}`);
  revalidateTag("catalog");
  redirect(`/instructor/courses/${courseId}?deleted=1`);
}
