import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured, supabaseServiceKey, supabaseUrl } from "../env";

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error("Supabase admin credentials are not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
