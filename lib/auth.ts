import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { getLocalAdminSession } from "./local-admin";
import { isAdminRole } from "./roles";
import type { Profile } from "./types";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile
      ? ({
          id: profile.id,
          fullName: profile.full_name,
          email: user.email ?? "",
          role: profile.role,
          createdAt: profile.created_at,
        } satisfies Profile)
      : ({
          id: user.id,
          fullName: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "Student",
          email: user.email ?? "",
          role: "student",
          createdAt: user.created_at,
        } satisfies Profile),
  };
});

export async function requireUser(nextPath = "/dashboard") {
  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return current;
}

export async function requireAdmin() {
  const current = await getCurrentUser();

  if (!current) {
    const local = await getLocalAdminSession();
    if (local) {
      return {
        id: "local-admin",
        email: local.email,
        profile: {
          id: "local-admin",
          fullName: "Local Admin",
          email: local.email,
          role: "super_admin",
          createdAt: new Date().toISOString(),
        } satisfies Profile,
      };
    }
    redirect("/admin/login");
  }

  if (!isAdminRole(current.profile.role)) {
    redirect(current.profile.role === "teacher" ? "/teacher" : "/dashboard");
  }
  return current;
}

export async function requireSuperAdmin() {
  const current = await requireAdmin();
  if (current.profile.role !== "super_admin") redirect("/admin");
  return current;
}

export async function requireTeacher() {
  const current = await getCurrentUser();

  if (!current) redirect("/login?next=%2Fteacher");

  if (current.profile.role === "teacher") return current;

  if (isAdminRole(current.profile.role)) redirect("/admin");

  redirect("/dashboard");
}
