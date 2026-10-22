import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "../env";
import { createSupabaseAdminClient } from "./admin";
import { createSupabaseServerClient } from "./server";

export async function getAdminClient(): Promise<SupabaseClient> {
  if (isSupabaseAdminConfigured) return createSupabaseAdminClient();

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured. Add your project URL and publishable key to .env.local.");
  return supabase;
}
