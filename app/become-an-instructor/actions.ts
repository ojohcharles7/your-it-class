"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import type { AdminActionState } from "@/lib/types";

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach you on."),
  courseTopic: z.string().trim().min(3, "Tell us what you want to teach."),
  experience: z.string().trim().min(20, "Tell us a little more about your experience."),
  additionalInfo: z.string().trim().max(2000).optional(),
});

export async function submitInstructorApplicationAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = applicationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    courseTopic: formData.get("courseTopic"),
    experience: formData.get("experience"),
    additionalInfo: formData.get("additionalInfo") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  if (!isSupabaseConfigured) {
    return {
      message:
        "Preview mode: your application was not saved. Connect Supabase to accept real instructor applications.",
    };
  }

  const current = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Applications are temporarily unavailable. Please try again later." };

  const { error } = await supabase.from("instructor_applications").insert({
    user_id: current?.id ?? null,
    full_name: parsed.data.fullName,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    course_topic: parsed.data.courseTopic,
    experience: parsed.data.experience,
    additional_info: parsed.data.additionalInfo ?? "",
    status: "pending",
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You already have an application pending review."
          : "Could not submit your application. Please try again.",
    };
  }

  return {
    message:
      "Application received. We review every application manually and will email you if you are approved.",
  };
}
