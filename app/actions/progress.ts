"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export async function setLessonComplete(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const completed = formData.get("completed") === "true";

  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=${encodeURIComponent(`/dashboard/courses/${slug}`)}`);
  if (!isSupabaseAdminConfigured) return;

  const admin = createSupabaseAdminClient();

  const [{ data: lesson }, { data: enrollment }] = await Promise.all([
    admin.from("lessons").select("id, course_id").eq("id", lessonId).maybeSingle(),
    admin.from("enrollments").select("id").eq("user_id", current.id).eq("course_id", courseId).maybeSingle(),
  ]);

  if (!lesson || lesson.course_id !== courseId || !enrollment) return;

  if (completed) {
    await admin
      .from("lesson_progress")
      .upsert({ user_id: current.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" });
  } else {
    await admin.from("lesson_progress").delete().eq("user_id", current.id).eq("lesson_id", lessonId);
  }

  revalidatePath(`/dashboard/courses/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");
}
