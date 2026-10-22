import { existsSync } from "node:fs";

const DEFAULT_EMAIL = "ojohcharles7@gmail.com";
const DEFAULT_PASSWORD = "Admin@2026";
const DEFAULT_NAME = "Master Admin";

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
  const email = (process.env.MASTER_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.MASTER_ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const fullName = process.env.MASTER_ADMIN_NAME || DEFAULT_NAME;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    console.error("Add the service role key, then run `npm run create-master` again.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId: string | null = null;

  for (let page = 1; page <= 20 && !userId; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Could not list users:", error.message);
      process.exit(1);
    }
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) userId = match.id;
    if (data.users.length < 1000) break;
  }

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("Could not update the master account:", error.message);
      process.exit(1);
    }
    console.log(`✓ Updated existing master account ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      console.error("Could not create the master account:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`✓ Created master account ${email}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role: "super_admin" }, { onConflict: "id" });
  if (profileError) {
    console.error("Could not set the master role:", profileError.message);
    process.exit(1);
  }

  console.log("✓ Role set to super_admin.");
  console.log(`\nLog in at /login with:\n  Email:    ${email}\n  Password: ${password}`);
  console.log("Then open /admin/teachers to add teachers and assign their classes.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
