import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./env";

const COOKIE_NAME = "learnhub_local_admin";
const SESSION_SECONDS = 60 * 60 * 8;

export const localAdminEnabled = !isSupabaseConfigured;

export const localAdminEmail = (process.env.LOCAL_ADMIN_EMAIL?.trim() || "admin@learnhub.local").toLowerCase();
export const localAdminPassword = process.env.LOCAL_ADMIN_PASSWORD?.trim() || "admin123";
export const localAdminUsingDefaults = !process.env.LOCAL_ADMIN_PASSWORD?.trim();

const secret =
  process.env.LOCAL_ADMIN_SECRET?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  "learnhub-local-admin-preview";

function signature(value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function tokenFor(email: string) {
  const payload = Buffer.from(email).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export async function getLocalAdminSession(): Promise<{ email: string } | null> {
  if (!localAdminEnabled) return null;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  if (!equal(provided, signature(payload))) return null;

  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8").toLowerCase();
  } catch {
    return null;
  }
  if (email !== localAdminEmail) return null;
  return { email };
}

export async function createLocalAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, tokenFor(localAdminEmail), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroyLocalAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function verifyLocalAdminCredentials(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const emailMatches = equal(normalized, localAdminEmail);
  const passwordMatches = equal(password, localAdminPassword);
  return emailMatches && passwordMatches;
}
