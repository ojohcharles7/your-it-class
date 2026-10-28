"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById, isEnrolled } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export type EnrollmentState = {
  error?: string;
  message?: string;
};

const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export async function startEnrollment(_state: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const courseId = String(formData.get("courseId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const couponCode = String(formData.get("couponCode") ?? "").trim().toUpperCase();
  const referralCode = String(formData.get("referralCode") ?? "").trim().toLowerCase();
  const payerName = String(formData.get("payerName") ?? "").trim();
  const payerPhone = String(formData.get("payerPhone") ?? "").trim();
  const bankReference = String(formData.get("bankReference") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const proof = formData.get("proof");

  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);

  const course = await getCourseById(courseId);
  if (!course) return { error: "This course could not be found." };
  if (await isEnrolled(current.id, course.id)) {
    redirect(`/dashboard/courses/${course.slug}`);
  }

  if (!isSupabaseAdminConfigured) {
    return { error: "Payments are not connected yet. Add your Supabase URL and service role key to .env.local." };
  }
  if (payerName.length < 2) return { error: "Enter the name used for the bank transfer." };
  if (bankReference.length < 2) return { error: "Enter the bank transfer reference or session ID." };
  if (!(proof instanceof File) || proof.size === 0) {
    return { error: "Upload your payment receipt (JPG, PNG, WebP or PDF)." };
  }
  if (proof.size > MAX_PROOF_BYTES) return { error: "Payment proof must be 10 MB or smaller." };
  const extension = ALLOWED_PROOF_TYPES.get(proof.type);
  if (!extension) return { error: "Upload a JPG, PNG, WebP or PDF payment receipt." };

  const admin = createSupabaseAdminClient();

  let discountKobo = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .ilike("code", couponCode)
      .eq("active", true)
      .maybeSingle();
    if (!coupon) return { error: "That coupon code is not valid." };
    if (coupon.course_id && coupon.course_id !== course.id) {
      return { error: "That coupon does not apply to this course." };
    }
    const now = Date.now();
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
      return { error: "That coupon is not active yet." };
    }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
      return { error: "That coupon has expired." };
    }
    if (coupon.max_redemptions != null) {
      const { count } = await admin
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);
      if ((count ?? 0) >= coupon.max_redemptions) {
        return { error: "That coupon has reached its redemption limit." };
      }
    }
    discountKobo =
      coupon.discount_type === "percent"
        ? Math.floor((course.priceKobo * Number(coupon.discount_value)) / 100)
        : Math.min(course.priceKobo, Number(coupon.discount_value));
    couponId = coupon.id;
  }

  let saleChannel: "marketplace" | "referral" = "marketplace";
  let validReferralCode = "";
  if (referralCode) {
    const { data: referrer } = await admin
      .from("instructor_profiles")
      .select("user_id, slug")
      .eq("slug", referralCode)
      .maybeSingle();
    if (referrer) {
      saleChannel = "referral";
      validReferralCode = referrer.slug;
    }
  }

  const amountKobo = Math.max(0, course.priceKobo - discountKobo);
  const proofPath = `${current.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from("payment-proofs").upload(proofPath, proof, {
    contentType: proof.type,
    upsert: false,
  });
  if (uploadError) {
    return { error: `Could not upload payment proof: ${uploadError.message}` };
  }

  const { error: insertError } = await admin.from("payment_submissions").insert({
    user_id: current.id,
    course_id: course.id,
    coupon_id: couponId,
    original_amount_kobo: course.priceKobo,
    discount_kobo: discountKobo,
    amount_kobo: amountKobo,
    sale_channel: saleChannel,
    referral_code: validReferralCode,
    payer_name: payerName,
    payer_phone: payerPhone,
    bank_reference: bankReference,
    note,
    proof_path: proofPath,
    status: "pending",
  });

  if (insertError) {
    await admin.storage.from("payment-proofs").remove([proofPath]);
    if (insertError.code === "23505") {
      return { error: "You already have a payment waiting for review for this course." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  revalidatePath(`/courses/${course.slug}`);
  revalidateTag("catalog");
  redirect("/dashboard/payments?submitted=1");
}
