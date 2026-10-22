import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isPaystackConfigured, isSupabaseAdminConfigured } from "@/lib/env";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/paystack";

export const runtime = "nodejs";

type WebhookEvent = {
  event: string;
  data?: { reference?: string; status?: string };
};

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured || !isPaystackConfigured) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const transaction = await verifyTransaction(event.data.reference);
    if (transaction.status !== "success" || transaction.currency !== "NGN") {
      return NextResponse.json({ received: true });
    }

    const metadata = transaction.metadata ?? {};
    const userId = typeof metadata.user_id === "string" ? metadata.user_id : "";
    const courseId = typeof metadata.course_id === "string" ? metadata.course_id : "";
    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing payment metadata." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: course } = await admin
      .from("courses")
      .select("id, price_kobo")
      .eq("id", courseId)
      .maybeSingle();

    if (!course || Number(transaction.amount) !== Number(course.price_kobo)) {
      return NextResponse.json({ error: "Payment does not match course." }, { status: 400 });
    }

    const reference = transaction.reference;

    const { error: paymentError } = await admin.from("payments").upsert(
      {
        reference,
        user_id: userId,
        course_id: courseId,
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
        user_id: userId,
        course_id: courseId,
        amount_kobo: Number(transaction.amount),
        paystack_ref: reference,
      },
      { onConflict: "user_id,course_id" },
    );
    if (enrollmentError) throw enrollmentError;

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
