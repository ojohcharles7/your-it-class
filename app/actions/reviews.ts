"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export type ReviewState = { error?: string; message?: string };

const reviewSchema = z.object({
  courseId: z.string().min(1),
  slug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Write at least a short sentence.").max(600, "Keep it under 600 characters."),
});

export async function submitReviewAction(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Please log in to leave a review." };

  const parsed = reviewSchema.safeParse({
    courseId: formData.get("courseId"),
    slug: formData.get("slug"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your review." };

  if (!isSupabaseAdminConfigured) return { error: "Reviews are not connected yet." };

  const admin = createSupabaseAdminClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", current.id)
    .eq("course_id", parsed.data.courseId)
    .maybeSingle();

  if (!enrollment) return { error: "Enrol in this course before leaving a review." };

  const { error } = await admin.from("reviews").upsert(
    {
      course_id: parsed.data.courseId,
      user_id: current.id,
      author_name: current.profile.fullName || current.email.split("@")[0],
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    { onConflict: "user_id,course_id" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/courses/${parsed.data.slug}`);
  revalidateTag("catalog");
  return { message: "Thanks — your review has been published." };
}
