import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { isPaystackConfigured, isSupabaseAdminConfigured, siteUrl } from "@/lib/env";
import { verifyTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  const failure = (reason: string) => NextResponse.redirect(new URL(`/dashboard?payment=${reason}`, siteUrl));

  if (!reference) return failure("missing");
  if (!isSupabaseAdminConfigured || !isPaystackConfigured) return failure("not_configured");

  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(`/payment/callback?reference=${reference}`)}`, siteUrl),
    );
  }

  try {
    const transaction = await verifyTransaction(reference);
    if (transaction.status !== "success") return failure("failed");

    const metadata = transaction.metadata ?? {};
    const courseId = typeof metadata.course_id === "string" ? metadata.course_id : "";
    if (!courseId || metadata.user_id !== current.id) return failure("unverified");

    const admin = createSupabaseAdminClient();
    const { data: course } = await admin
      .from("courses")
      .select("id, slug, price_kobo")
      .eq("id", courseId)
      .maybeSingle();

    if (!course) return failure("course_not_found");
    if (Number(transaction.amount) !== Number(course.price_kobo) || transaction.currency !== "NGN") {
      return failure("amount_mismatch");
    }

    const { error: paymentError } = await admin.from("payments").upsert(
      {
        reference,
        user_id: current.id,
        course_id: course.id,
        amount_kobo: Number(transaction.amount),
        status: "success",
        provider: "paystack",
        raw: transaction,
      },
      { onConflict: "reference" },
    );
    if (paymentError) throw paymentError;

    const { error: enrollmentError } = await admin.from("enrollments").upsert(
      {
        user_id: current.id,
        course_id: course.id,
        amount_kobo: Number(transaction.amount),
        paystack_ref: reference,
      },
      { onConflict: "user_id,course_id" },
    );
    if (enrollmentError) throw enrollmentError;

    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidateTag("catalog");
    return NextResponse.redirect(new URL(`/dashboard/courses/${course.slug}?enrolled=1`, siteUrl));
  } catch (error) {
    console.error("Payment verification failed:", error);
    return failure("error");
  }
}
