import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

function consoleHeaders(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isMaster = pathname === "/master" || pathname.startsWith("/master/");
  const headers = new Headers(request.headers);
  headers.set("x-console-base", isMaster ? "/master" : "/admin");
  headers.set("x-pathname", pathname);
  return headers;
}

export async function middleware(request: NextRequest) {
  const headers = consoleHeaders(request);
  const next = () => NextResponse.next({ request: { headers } });

  if (!isSupabaseConfigured) return next();

  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
  if (!hasAuthCookie) return next();

  let response = next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const refreshedHeaders = consoleHeaders(request);
        response = NextResponse.next({ request: { headers: refreshedHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getSession();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
