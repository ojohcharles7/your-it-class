"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById, isEnrolled } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isPaystackConfigured, isSupabaseAdminConfigured, paymentsProvider, siteUrl } from "@/lib/env";
import { initializeTransaction, newReference } from "@/lib/paystack";

export type EnrollmentState = {
  error?: string;
};

export async function startEnrollment(_state: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const courseId = String(formData.get("courseId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);

  const course = await getCourseById(courseId);
  if (!course) return { error: "This course could not be found." };

  if (await isEnrolled(current.id, course.id)) {
    redirect(`/dashboard/courses/${course.slug}`);
  }

  if (!isSupabaseAdminConfigured) {
    return {
      error: "Enrollment is not connected yet. Add your Supabase URL and service role key to .env.local.",
    };
  }

  const admin = createSupabaseAdminClient();
  const amount = course.priceKobo;

  if (paymentsProvider === "mock") {
    const reference = newReference();
    const { error: enrollmentError } = await admin.from("enrollments").upsert(
      {
        user_id: current.id,
        course_id: course.id,
        amount_kobo: amount,
        paystack_ref: reference,
      },
      { onConflict: "user_id,course_id" },
    );
    if (enrollmentError) return { error: enrollmentError.message };

    await admin.from("payments").upsert(
      {
        reference,
        user_id: current.id,
        course_id: course.id,
        amount_kobo: amount,
        status: "success",
        provider: "mock",
        raw: { mode: "mock", course: course.slug },
      },
      { onConflict: "reference" },
    );

    revalidatePath("/dashboard");
    redirect(`/dashboard/courses/${course.slug}?enrolled=1`);
  }

  if (!isPaystackConfigured) {
    return {
      error: "Payments are not configured. Add PAYSTACK_SECRET_KEY to .env.local, or set PAYMENTS_PROVIDER=mock for local testing.",
    };
  }

  const reference = newReference();
  let authorizationUrl: string;

  try {
    const { error: paymentError } = await admin.from("payments").insert({
      reference,
      user_id: current.id,
      course_id: course.id,
      amount_kobo: amount,
      status: "pending",
      provider: "paystack",
      raw: { initialized: true },
    });
    if (paymentError) return { error: paymentError.message };

    const transaction = await initializeTransaction({
      email: current.email,
      amountKobo: amount,
      reference,
      callbackUrl: `${siteUrl}/payment/callback`,
      metadata: { user_id: current.id, course_id: course.id, slug: course.slug },
    });
    authorizationUrl = transaction.authorization_url;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not start checkout. Please try again." };
  }

  redirect(authorizationUrl);
}
