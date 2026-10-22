export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceKey);

export const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
export const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "";
export const isPaystackConfigured = Boolean(paystackSecretKey);

export const paymentsProvider =
  process.env.NODE_ENV !== "production" && process.env.PAYMENTS_PROVIDER !== "paystack" ? "mock" : "paystack";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@youritclass.com";
