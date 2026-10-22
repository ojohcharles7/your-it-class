import { existsSync } from "node:fs";

async function main() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      break;
    }
  }

  const { createClient } = await import("@supabase/supabase-js");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.argv[2]?.trim().toLowerCase();

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  if (!email) {
    console.error("Usage: npm run grant-admin you@example.com");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let found: { id: string; email?: string } | null = null;

  for (let page = 1; page <= 20 && !found; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Could not list users:", error.message);
      process.exit(1);
    }
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) found = { id: match.id, email: match.email };
    if (data.users.length < 1000) break;
  }

  if (!found) {
    console.error(`No account found for ${email}. Sign up in the app first, then run this again.`);
    process.exit(1);
  }

  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", found.id);
  if (error) {
    console.error("Could not grant admin:", error.message);
    process.exit(1);
  }

  console.log(`✓ ${email} is now an administrator. Log out and back in, then visit /admin.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
