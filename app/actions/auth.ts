"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { destroyLocalAdminSession, getLocalAdminSession } from "@/lib/local-admin";
import { getCurrentUser } from "@/lib/auth";

export type AuthState = {
  error?: string;
  message?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name."),
});

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const passwordResetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not connected yet. Add your project keys to .env.local to enable accounts." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signupAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not connected yet. Add your project keys to .env.local to enable accounts." };
  }

  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    return { message: "Account created. Check your email to confirm your address, then log in." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordResetAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not connected yet. Add your project keys to .env.local to enable accounts." };
  }

  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error?.status === 429) {
    return { error: "Too many reset attempts. Please wait a few minutes and try again." };
  }

  return {
    message: "If an account exists for that email, we've sent a reset link. Check your inbox and spam folder.",
  };
}

export async function updatePasswordAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not connected yet." };
  }

  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your new password." };

  const current = await getCurrentUser();
  if (!current) {
    return { error: "Your reset link has expired or was already used. Request a new one." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { message: "Your password has been updated. You can now use it to log in." };
}

export async function signOutAction() {
  const local = await getLocalAdminSession();
  await destroyLocalAdminSession();

  if (local) {
    revalidatePath("/", "layout");
    redirect("/admin/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
