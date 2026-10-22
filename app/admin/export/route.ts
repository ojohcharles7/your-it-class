import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export const runtime = "nodejs";

function cell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  if (!isSupabaseAdminConfigured) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const type = request.nextUrl.searchParams.get("type") ?? "payments";
  if (!["payments", "students", "courses", "certificates"].includes(type)) {
    return NextResponse.json({ error: "Unknown export type." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const stamp = new Date().toISOString().slice(0, 10);
  let rows: unknown[][] = [];
  let filename = `${type}-${stamp}.csv`;

  if (type === "payments") {
    const [{ data: paymentRows }, { data: profileRows }, { data: courseRows }] = await Promise.all([
      admin.from("payments").select("*").order("created_at", { ascending: false }),
      admin.from("profiles").select("id, full_name"),
      admin.from("courses").select("id, title"),
    ]);
    const names = new Map((profileRows ?? []).map((profile) => [profile.id, profile.full_name]));
    const titles = new Map((courseRows ?? []).map((course) => [course.id, course.title]));

    rows = [
      ["Date", "Reference", "Student", "Course", "Amount (NGN)", "Status", "Provider"],
      ...(paymentRows ?? []).map((payment) => [
        payment.created_at,
        payment.reference,
        names.get(payment.user_id) || "Student",
        titles.get(payment.course_id) || "Course",
        (Number(payment.amount_kobo) / 100).toFixed(2),
        payment.status,
        payment.provider,
      ]),
    ];
  }

  if (type === "students") {
    const [{ data: profileRows }, { data: enrollmentRows }, { data: userList }] = await Promise.all([
      admin.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
      admin.from("enrollments").select("user_id, status"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const emails = new Map((userList?.users ?? []).map((user) => [user.id, user.email ?? ""]));
    const enrollments = enrollmentRows ?? [];

    rows = [
      ["Name", "Email", "Role", "Enrolments", "Completed", "Joined"],
      ...(profileRows ?? []).map((profile) => {
        const own = enrollments.filter((enrollment) => enrollment.user_id === profile.id);
        return [
          profile.full_name || "Unnamed student",
          emails.get(profile.id) || "",
          profile.role,
          own.length,
          own.filter((enrollment) => enrollment.status === "completed").length,
          profile.created_at,
        ];
      }),
    ];
  }

  if (type === "courses") {
    const { data: courseRows } = await admin
      .from("courses")
      .select("*, lessons(count), enrollments(count)")
      .order("created_at", { ascending: true });

    rows = [
      ["Title", "Slug", "Category", "Level", "Price (NGN)", "Lessons", "Students", "Status", "Created"],
      ...(courseRows ?? []).map((course) => [
        course.title,
        course.slug,
        course.category,
        course.level,
        (Number(course.price_kobo) / 100).toFixed(2),
        course.lessons?.[0]?.count ?? 0,
        course.enrollments?.[0]?.count ?? 0,
        course.published ? "Published" : "Draft",
        course.created_at,
      ]),
    ];
    filename = `courses-${stamp}.csv`;
  }

  if (type === "certificates") {
    const [{ data: certificateRows }, { data: profileRows }, { data: courseRows }] = await Promise.all([
      admin.from("certificates").select("*").order("issued_at", { ascending: false }),
      admin.from("profiles").select("id, full_name"),
      admin.from("courses").select("id, title"),
    ]);
    const names = new Map((profileRows ?? []).map((profile) => [profile.id, profile.full_name]));
    const titles = new Map((courseRows ?? []).map((course) => [course.id, course.title]));

    rows = [
      ["Serial", "Student", "Course", "Issued", "Verify URL"],
      ...(certificateRows ?? []).map((certificate) => [
        certificate.serial,
        names.get(certificate.user_id) || "Student",
        titles.get(certificate.course_id) || "Course",
        certificate.issued_at,
        `/verify/${certificate.serial}`,
      ]),
    ];
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
