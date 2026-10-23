"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/course-input";
import { getAdminUserEmails } from "@/lib/data";
import { isSupabaseAdminConfigured, siteUrl } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin-data";

function back(path: string, key: "ok" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function actionError(error: { message: string } | null, fallback: string) {
  return error?.message || fallback;
}

async function requireWritableMaster(path: string) {
  const current = await requireSuperAdmin();
  if (current.id === "local-admin") {
    back(path, "error", "Local preview is read-only. Connect Supabase to make changes.");
  }
  return current;
}

async function defaultInstructorShare() {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "instructor_default_share")
    .maybeSingle();
  const parsed = Number(data?.value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 60;
}

async function uniqueInstructorSlug(base: string, userId: string) {
  const admin = await getAdminClient();
  const root = slugify(base) || "instructor";
  const { data } = await admin.from("instructor_profiles").select("user_id, slug").eq("slug", root).maybeSingle();
  if (!data || data.user_id === userId) return root;
  return `${root}-${userId.slice(0, 6)}`;
}

export async function approveInstructorApplicationAction(formData: FormData) {
  const current = await requireWritableMaster("/master/applications");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = await getAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("instructor_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (applicationError || !application) back("/master/applications", "error", "Application not found.");

  const app = application as {
    id: string;
    user_id: string | null;
    full_name: string;
    email: string;
    status: string;
  };

  const emails = await getAdminUserEmails();
  let userId = app.user_id;

  if (!userId) {
    const match = [...emails.entries()].find(([, email]) => email.toLowerCase() === app.email.toLowerCase());
    userId = match?.[0] ?? null;
  }

  if (!userId) {
    if (!isSupabaseAdminConfigured) {
      back(
        "/master/applications",
        "error",
        "No account exists for this email. Add SUPABASE_SERVICE_ROLE_KEY to invite the applicant automatically.",
      );
    }

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(app.email, {
      data: { full_name: app.full_name },
      redirectTo: `${siteUrl}/auth/callback?next=/instructor`,
    });

    if (inviteError || !invited.user) {
      back("/master/applications", "error", actionError(inviteError, "Could not invite this applicant."));
    }
    userId = invited.user.id;
  }

  const { error: roleError } = await admin.from("profiles").update({ role: "teacher" }).eq("id", userId);
  if (roleError) back("/master/applications", "error", roleError.message);

  const { data: existingProfile } = await admin
    .from("instructor_profiles")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const slug = await uniqueInstructorSlug(app.full_name, userId);
    const share = await defaultInstructorShare();
    const { error: profileError } = await admin.from("instructor_profiles").insert({
      user_id: userId,
      slug,
      headline: "",
      bio: "",
      phone: "",
      expertise: [],
      is_public: true,
      revenue_share_percent: share,
    });
    if (profileError) back("/master/applications", "error", profileError.message);
  }

  const { error } = await admin
    .from("instructor_applications")
    .update({
      status: "approved",
      user_id: userId,
      review_note: "",
      reviewed_by: current.id === "local-admin" ? null : current.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) back("/master/applications", "error", error.message);

  revalidatePath("/master");
  revalidatePath("/master/applications");
  revalidatePath("/master/instructors");
  revalidatePath("/instructors");
  back("/master/applications", "ok", `${app.full_name} is now an instructor.`);
}

export async function rejectInstructorApplicationAction(formData: FormData) {
  const current = await requireWritableMaster("/master/applications");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!id) return;

  const admin = await getAdminClient();
  const { error } = await admin
    .from("instructor_applications")
    .update({
      status: "rejected",
      review_note: note,
      reviewed_by: current.id === "local-admin" ? null : current.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) back("/master/applications", "error", error.message);
  revalidatePath("/master/applications");
  back("/master/applications", "ok", "Application rejected.");
}

export async function reviewCourseAction(formData: FormData) {
  const current = await requireWritableMaster("/master/approvals");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!id || !["approve", "reject", "unpublish"].includes(decision)) return;

  const admin = await getAdminClient();
  const now = new Date().toISOString();

  const values =
    decision === "approve"
      ? {
          review_status: "published",
          published: true,
          review_note: note,
          reviewed_by: current.id === "local-admin" ? null : current.id,
          reviewed_at: now,
        }
      : decision === "unpublish"
        ? {
            review_status: "draft",
            published: false,
            review_note: note,
            reviewed_by: current.id === "local-admin" ? null : current.id,
            reviewed_at: now,
          }
        : {
            review_status: "rejected",
            published: false,
            review_note: note,
            reviewed_by: current.id === "local-admin" ? null : current.id,
            reviewed_at: now,
          };

  const { error } = await admin.from("courses").update(values).eq("id", id);
  if (error) back("/master/approvals", "error", error.message);

  revalidatePath("/master");
  revalidatePath("/master/approvals");
  revalidatePath("/master/instructors");
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidateTag("catalog");
  back(
    "/master/approvals",
    "ok",
    decision === "approve" ? "Course approved and published." : decision === "unpublish" ? "Course unpublished." : "Course sent back to the instructor.",
  );
}

export async function setInstructorShareAction(formData: FormData) {
  await requireWritableMaster("/master/instructors");
  const userId = String(formData.get("userId") ?? "");
  const share = z.coerce.number().min(0).max(100).safeParse(formData.get("sharePercent"));
  if (!userId || !share.success) back("/master/instructors", "error", "Enter a share between 0 and 100.");

  const admin = await getAdminClient();
  const { error } = await admin
    .from("instructor_profiles")
    .update({
      revenue_share_percent: share.data,
      is_public: formData.get("isPublic") === "on",
    })
    .eq("user_id", userId);

  if (error) back("/master/instructors", "error", error.message);
  revalidatePath("/master/instructors");
  revalidatePath("/instructors");
  back("/master/instructors", "ok", "Instructor settings updated.");
}

export async function assignCourseOwnerAction(formData: FormData) {
  await requireWritableMaster("/master/instructors");
  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!courseId) return;

  const admin = await getAdminClient();
  const { error } = await admin
    .from("courses")
    .update({ instructor_id: userId || null })
    .eq("id", courseId);

  if (error) back("/master/instructors", "error", error.message);
  revalidatePath("/master/instructors");
  revalidatePath("/master/approvals");
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidateTag("catalog");
  back("/master/instructors", "ok", userId ? "Course owner updated." : "Course owner cleared.");
}

export async function promoteInstructorAction(formData: FormData) {
  await requireWritableMaster("/master/instructors");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) back("/master/instructors", "error", "Enter an email address.");

  if (!isSupabaseAdminConfigured) {
    back("/master/instructors", "error", "Add SUPABASE_SERVICE_ROLE_KEY to promote existing accounts automatically.");
  }

  const admin = await getAdminClient();
  const emails = await getAdminUserEmails();
  const match = [...emails.entries()].find(([, value]) => value.toLowerCase() === email);
  if (!match) back("/master/instructors", "error", "No account found for that email.");

  const userId = match[0];
  const { error: roleError } = await admin.from("profiles").update({ role: "teacher" }).eq("id", userId);
  if (roleError) back("/master/instructors", "error", roleError.message);

  const { data: existing } = await admin.from("instructor_profiles").select("slug").eq("user_id", userId).maybeSingle();
  if (!existing) {
    const name = email.split("@")[0];
    const slug = await uniqueInstructorSlug(name, userId);
    const share = await defaultInstructorShare();
    const { error } = await admin.from("instructor_profiles").insert({
      user_id: userId,
      slug,
      is_public: true,
      revenue_share_percent: share,
      expertise: [],
    });
    if (error) back("/master/instructors", "error", error.message);
  }

  revalidatePath("/master/instructors");
  revalidatePath("/instructors");
  back("/master/instructors", "ok", `${email} promoted to instructor.`);
}

export async function reviewPayoutAction(formData: FormData) {
  const current = await requireWritableMaster("/master/payouts");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  if (!id || !["approve", "reject", "paid"].includes(decision)) return;

  const admin = await getAdminClient();
  const now = new Date().toISOString();
  const values =
    decision === "approve"
      ? { status: "approved", review_note: note, reviewed_by: current.id === "local-admin" ? null : current.id, reviewed_at: now }
      : decision === "paid"
        ? {
            status: "paid",
            review_note: note,
            reference,
            reviewed_by: current.id === "local-admin" ? null : current.id,
            reviewed_at: now,
            paid_at: now,
          }
        : { status: "rejected", review_note: note, reviewed_by: current.id === "local-admin" ? null : current.id, reviewed_at: now };

  const { error } = await admin.from("payout_requests").update(values).eq("id", id);
  if (error) back("/master/payouts", "error", error.message);

  revalidatePath("/master");
  revalidatePath("/master/payouts");
  revalidatePath("/instructor/payouts");
  back("/master/payouts", "ok", decision === "paid" ? "Payout marked as paid." : "Payout updated.");
}

export async function savePlatformSettingsAction(formData: FormData) {
  await requireWritableMaster("/master/settings");
  const share = z.coerce.number().min(0).max(100).safeParse(formData.get("instructorDefaultShare"));
  if (!share.success) back("/master/settings", "error", "Enter a share between 0 and 100.");

  const admin = await getAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert(
      { key: "instructor_default_share", value: share.data, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  if (error) back("/master/settings", "error", error.message);
  revalidatePath("/master/settings");
  back("/master/settings", "ok", "Settings saved.");
}
