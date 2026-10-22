import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentUser();

  const response = NextResponse.json({
    user: current
      ? {
          name: current.profile.fullName,
          email: current.email,
          role: current.profile.role,
        }
      : null,
  });

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
