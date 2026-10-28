# LearnHub

A full-stack learning platform for Nigerian learners — built with Next.js 15, Supabase, Paystack and YouTube.

Video lessons, progress tracking, timed exams, verifiable certificates, payments and an admin panel.

> The original static site is preserved in [`legacy/`](./legacy) for reference.

## Stack

- **Next.js 15** (App Router, Server Actions, TypeScript strict)
- **Tailwind CSS v4** with a custom glassmorphism design system (light/dark)
- **Supabase** — Postgres, Auth, Row Level Security
- **Paystack** — Naira checkout + HMAC-verified webhooks (test mode ready)
- **YouTube** embeds for lessons (privacy-friendly `youtube-nocookie.com`)

## Features

- Landing page, catalogue with search/filter/sort, course detail with free preview
- Email/password auth with email confirmation, password reset and an `/auth/callback` handler,
  protected student dashboard and admin panel
- Account settings: update name, change password and permanently delete an account
- Terms, privacy, refund and support pages
- Enrolment via Paystack (or a local mock provider), instant unlock
- Per-lesson completion, progress bars, continue-learning
- Timed final exams scored on the server (answers never sent to the browser)
- Certificates with unique serial numbers, printable to PDF and publicly verifiable
- Admin control center: analytics dashboard, command palette, course/lesson/exam-question CRUD,
  students and roles, payments, certificate registry, search/filters and CSV exports
- Installable PWA: manifest, maskable icons, install prompt and offline fallback
- SEO metadata, sitemap, robots, JSON-LD, accessible responsive UI

## Quick start (UI only, no credentials)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Public pages use bundled fixture data, so the site works before Supabase is configured.

### Local admin preview

The admin panel works without any credentials so you can review the full interface first. Visit
`/admin/login` and sign in with:

```
admin@learnhub.local
admin123
```

The dashboard, catalogue, students, payments and certificates pages render with sample/empty states.
Writes, exports and live records stay disabled until Supabase is connected. Override the credentials in
`.env.local`:

```env
LOCAL_ADMIN_EMAIL=admin@learnhub.local
LOCAL_ADMIN_PASSWORD=choose-a-strong-password
LOCAL_ADMIN_SECRET=random-long-string
```

Local preview mode turns off automatically as soon as `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set — use the real Supabase admin flow below from that point.

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/`](./supabase/migrations) **in filename order** (the SQL
   Editor cannot run a folder, so open each file and execute it). The latest file adds
   `exam_sessions`, which enforces exam time limits on the server.
   Or, with the Supabase CLI: `supabase db push`.
3. In **Project Settings → API**, copy the project URL, `anon` key and `service_role` key.
4. Create `.env.local` from the example:

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SUPPORT_EMAIL=support@learnhub.com
   ```

5. **Authentication → URL Configuration**: add `<NEXT_PUBLIC_SITE_URL>/auth/callback` to the
   allowed **Redirect URLs** (e.g. `http://localhost:3000/auth/callback` and your production URL).
   Password reset and email confirmation links use this route.
6. **Authentication → Providers → Email**: for the smoothest local testing, disable
   “Confirm email”. Otherwise configure email templates / callback URLs first.
7. Seed the catalogue:

   ```bash
   npm run db:seed
   ```

8. Sign up in the app, then grant yourself admin access:

   ```bash
   npm run grant-admin you@example.com
   ```

   Log out and back in, then visit `/admin`.

> `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

### Admin & instructors

After running the migrations:

1. Log in as an admin and open **`/admin/teachers`**.
2. Add a teacher (with the service key) or ask the teacher to sign up and promote their email.
3. Tick the classes that teacher teaches and save.
4. The teacher logs in and opens **`/instructor`** to see their classes and every learner who paid.

### Master user

The master account is `ojohcharles7@gmail.com` / `Admin@2026`. Apply
`20261029000000_master_user.sql` to link it as a `master` profile. Master users sign in
through the yellow dot in the footer and can assign roles or create staff accounts from
`/admin/students`. Override the linked email with `MASTER_ADMIN_EMAIL`.

## 2. Paystack setup

1. Create a test account at [paystack.com](https://paystack.com) and open
   **Settings → Developers → API Keys**.
2. Add to `.env.local`:

   ```env
   PAYSTACK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYMENTS_PROVIDER=paystack
   ```

3. Normal checkout works through the callback URL automatically.
4. For the webhook safety net, expose your local server (e.g. `ngrok http 3000`) and add the
   webhook URL in Paystack:

   ```
   https://<your-public-url>/api/paystack/webhook
   ```

   Subscribe to `charge.success`.

**Testing without Paystack keys:** set `PAYMENTS_PROVIDER=mock` (default for `NODE_ENV !== "production"`).
The enrol button instantly creates a successful test enrolment and payment record. Mock mode is
automatically disabled in production.

## 3. Videos

Seed lessons use placeholder YouTube IDs from freeCodeCamp and similar channels. Replace them in
**Admin → Courses → [course] → Curriculum**, or update `lib/fixtures.ts` and re-run `npm run db:seed`.
The admin accepts either a raw YouTube ID or a full URL.

> Re-running the seed **replaces lessons and exams** for the seeded courses, which cascades to
> progress and exam attempts for those courses. Do not run it on production data.

## PWA

The app is installable on mobile: `app/manifest.ts` defines the manifest, `components/pwa/pwa-manager.tsx`
registers the service worker and shows the install prompt, and `public/sw.js` caches static assets plus the
`/offline` fallback. HTML pages are not cached so signed-in content never leaks between sessions. Bump
`VERSION` in `public/sw.js` whenever precached assets change. Installation requires HTTPS or `localhost`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run db:seed` | Seed courses, lessons, exams and questions |
| `npm run grant-admin <email>` | Promote an existing account to admin |

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/courses` | Catalogue |
| `/courses/[slug]` | Course detail, free preview, reviews |
| `/login`, `/signup` | Auth |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/auth/callback` | Email confirmation / recovery link handler |
| `/dashboard` | Overview |
| `/dashboard/settings` | Account settings and deletion |
| `/dashboard/courses/[slug]` | Lesson player + progress |
| `/dashboard/exams/[id]` | Timed exam |
| `/dashboard/payments` | Receipts |
| `/dashboard/certificates` | Earned certificates |
| `/certificate/[serial]` | Printable certificate |
| `/verify/[serial]` | Public verification |
| `/admin/login` | Local preview admin sign-in (no Supabase needed) |
| `/admin` | Admin analytics overview |
| `/admin/courses` | Course catalogue management |
| `/admin/courses/[id]` | Course, lesson and exam editor |
| `/admin/students` | Accounts, progress and roles |
| `/admin/export?type=payments` | CSV export (`payments`, `students`, `courses`, `certificates`) |
| `/api/paystack/webhook` | Paystack webhook |
| `/terms`, `/privacy`, `/refunds` | Legal policies |
| `/contact` | Support and contact details |
| `/offline` | Offline fallback shown by the service worker |
| `/manifest.webmanifest` | PWA manifest |

## Database & security

- All tables have **Row Level Security** enabled.
- Learners can only read their own enrolments, payments, attempts and progress.
- `exam_questions` (which contain correct answers) are admin-only; exams are fetched and scored
  server-side with the service role, and the client only receives prompts and options.
- Exam starts are recorded in `exam_sessions` (service-role only). Submission re-checks the
  deadline, the enrolment and that every lesson is complete, so refreshing or calling the action
  directly cannot bypass the timer or lesson gate.
- Enrolments are granted only by the server after a verified Paystack transaction (amount, currency
  and user metadata are re-checked). Webhooks are validated with an HMAC SHA-512 signature.
- Certificate verification runs server-side so learner profiles are not publicly exposed.
- Users cannot promote themselves — a trigger protects `profiles.role`.

## Deploying

1. Push the repo to GitHub and import it into Vercel.
2. Add all `.env.local` values to the Vercel project (use your production URL for `NEXT_PUBLIC_SITE_URL`).
3. Run the migration against your production Supabase project.
4. Update the Paystack webhook URL to `https://your-domain.com/api/paystack/webhook`.
5. Set `PAYMENTS_PROVIDER=paystack` in production.
6. Seed content with `npm run db:seed` locally against the production project (optional), or create
   courses through the admin panel.

## Project structure

```
app/                  routes, server actions and API handlers
components/           UI, marketing, dashboard, admin, certificate
lib/                  Supabase clients, data layer, Paystack, fixtures, types
supabase/migrations/  database schema + RLS
scripts/              seed and admin-grant scripts
legacy/               original static HTML/CSS/JS site
```

## Licence

Private project for Charitech Concepts & Services.
