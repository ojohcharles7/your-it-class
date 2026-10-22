"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export type AccountState = { error?: string; message?: string };

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80, "Keep your name under 80 characters."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

const deleteSchema = z.object({
  confirmation: z.literal("DELETE", { message: "Type DELETE exactly to confirm." }),
  password: z.string().min(1, "Enter your password to confirm."),
});

export async function updateProfileAction(_state: AccountState, formData: FormData): Promise<AccountState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Your session expired. Log in again." };

  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your name." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", current.id);
  if (profileError) return { error: profileError.message };

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });
  if (authError) return { error: authError.message };

  revalidatePath("/", "layout");
  return { message: "Profile updated." };
}

export async function changePasswordAction(_state: AccountState, formData: FormData): Promise<AccountState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Your session expired. Log in again." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your passwords." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: current.email,
    password: parsed.data.currentPassword,
  });
  if (authError) return { error: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { error: error.message };

  return { message: "Password changed." };
}

export async function deleteAccountAction(_state: AccountState, formData: FormData): Promise<AccountState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Your session expired. Log in again." };

  const parsed = deleteSchema.safeParse({
    confirmation: formData.get("confirmation"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the confirmation fields." };

  if (!isSupabaseAdminConfigured) {
    return { error: "Account deletion is not available until Supabase is fully configured." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not connected yet." };

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: current.email,
    password: parsed.data.password,
  });
  if (authError) return { error: "Your password is incorrect." };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(current.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?account=deleted");
}
