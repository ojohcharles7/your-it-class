import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEnrolled } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ authenticated: false, enrolled: false }, { status: 400 });
  }

  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json(
      { authenticated: false, enrolled: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const enrolled = await isEnrolled(current.id, courseId);
  return NextResponse.json(
    { authenticated: true, enrolled },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
