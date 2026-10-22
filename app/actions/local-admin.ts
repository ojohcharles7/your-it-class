"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createLocalAdminSession,
  localAdminEnabled,
  verifyLocalAdminCredentials,
} from "@/lib/local-admin";

export type LocalAdminState = { error?: string };

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter the local admin password."),
});

export async function localAdminLoginAction(
  _state: LocalAdminState,
  formData: FormData,
): Promise<LocalAdminState> {
  if (!localAdminEnabled) {
    return { error: "Local admin is disabled because Supabase is connected. Use the regular login." };
  }

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  if (!verifyLocalAdminCredentials(parsed.data.email, parsed.data.password)) {
    return { error: "That email and password do not match the local admin account." };
  }

  await createLocalAdminSession();
  revalidatePath("/", "layout");
  redirect("/admin");
}
