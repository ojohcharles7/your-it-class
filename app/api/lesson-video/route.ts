import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { COURSE_VIDEOS_BUCKET } from "@/lib/data";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { isAdminRole } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminClient } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const lessonId = request.nextUrl.searchParams.get("lessonId")?.trim();
  if (!lessonId) return new NextResponse("Lesson not found.", { status: 404 });

  const admin = isSupabaseAdminConfigured ? createSupabaseAdminClient() : await getAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, course_id, video_path, is_free, courses(published)")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson?.video_path) return new NextResponse("Video not found.", { status: 404 });

  const related = lesson.courses as { published: boolean } | { published: boolean }[] | null;
  const course = Array.isArray(related) ? related[0] : related;
  if (!course) return new NextResponse("Video not found.", { status: 404 });

  let allowed = Boolean(lesson.is_free && course.published);

  if (!allowed) {
    const current = await getCurrentUser();
    if (!current) return new NextResponse("Sign in to watch this lesson.", { status: 401 });

    const [{ data: enrollment }, { data: assignment }, { data: owned }] = await Promise.all([
      admin
        .from("enrollments")
        .select("id")
        .eq("user_id", current.id)
        .eq("course_id", lesson.course_id)
        .maybeSingle(),
      admin
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", current.id)
        .eq("course_id", lesson.course_id)
        .maybeSingle(),
      admin
        .from("courses")
        .select("id")
        .eq("id", lesson.course_id)
        .eq("instructor_id", current.id)
        .maybeSingle(),
    ]);

    allowed = Boolean(enrollment || assignment || owned || isAdminRole(current.profile.role));
  }

  if (!allowed) return new NextResponse("You do not have access to this lesson.", { status: 403 });

  const { data: signed, error } = await admin.storage
    .from(COURSE_VIDEOS_BUCKET)
    .createSignedUrl(lesson.video_path, 60 * 60 * 4);

  if (error || !signed?.signedUrl) {
    return new NextResponse("Video is unavailable.", { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl, {
    status: 307,
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
