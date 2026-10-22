-- Your IT Class — initial schema
-- Run this in the Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

-- =========================================================
-- Profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- =========================================================
-- Courses & lessons
-- =========================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  category text not null,
  level text not null default 'Beginner',
  price_kobo integer not null check (price_kobo >= 0),
  hours numeric(5, 1) not null default 0,
  rating numeric(2, 1) not null default 0,
  emoji text not null default '📘',
  gradient text not null default '#0a84ff,#6d5efc',
  outcomes text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 1,
  title text not null,
  youtube_id text not null default '',
  duration_min integer not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lessons_course_position_idx on public.lessons (course_id, position);

-- =========================================================
-- Enrollment & progress
-- =========================================================
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed')),
  amount_kobo integer not null default 0,
  paystack_ref text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- =========================================================
-- Exams
-- =========================================================
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  pass_score integer not null default 70 check (pass_score between 1 and 100),
  time_limit_min integer not null default 15,
  created_at timestamptz not null default now(),
  unique (course_id)
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists exam_questions_exam_position_idx on public.exam_questions (exam_id, position);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  score integer not null,
  total integer not null,
  passed boolean not null default false,
  answers jsonb not null default '{}',
  completed_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_idx on public.exam_attempts (user_id, completed_at desc);

-- =========================================================
-- Certificates, payments & reviews
-- =========================================================
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  serial text unique not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  amount_kobo integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  provider text not null default 'paystack',
  raw jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists reviews_course_idx on public.reviews (course_id, created_at desc);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- Profiles: only the owner or an admin can read/update.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Courses: public read of published courses, admin write.
drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read" on public.courses
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write" on public.courses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lessons: read when the parent course is published.
drop policy if exists "lessons_public_read" on public.lessons;
create policy "lessons_public_read" on public.lessons
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and (c.published or public.is_admin())
    )
  );

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write" on public.lessons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Enrollments: owner/admin read only; writes happen server-side with the service role.
drop policy if exists "enrollments_select_own_or_admin" on public.enrollments;
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Progress: owner can read and mark complete; admin can read all.
drop policy if exists "progress_select_own_or_admin" on public.lesson_progress;
create policy "progress_select_own_or_admin" on public.lesson_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "progress_insert_own" on public.lesson_progress;
create policy "progress_insert_own" on public.lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "progress_delete_own_or_admin" on public.lesson_progress;
create policy "progress_delete_own_or_admin" on public.lesson_progress
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Exams: students can see exam metadata for published courses, not questions.
drop policy if exists "exams_public_read" on public.exams;
create policy "exams_public_read" on public.exams
  for select to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = exams.course_id and (c.published or public.is_admin())
    )
  );

drop policy if exists "exams_admin_write" on public.exams;
create policy "exams_admin_write" on public.exams
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Questions contain answers: admin only. Server-side service role handles exams.
drop policy if exists "questions_admin_all" on public.exam_questions;
create policy "questions_admin_all" on public.exam_questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Attempts: owner/admin read, server-side writes only.
drop policy if exists "attempts_select_own_or_admin" on public.exam_attempts;
create policy "attempts_select_own_or_admin" on public.exam_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Certificates: owner/admin read; public verification goes through the server.
drop policy if exists "certificates_select_own_or_admin" on public.certificates;
create policy "certificates_select_own_or_admin" on public.certificates
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "certificates_admin_write" on public.certificates;
create policy "certificates_admin_write" on public.certificates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Payments: owner/admin read; writes server-side only.
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Reviews: public read, owners write.
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select to anon, authenticated
  using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- =========================================================
-- Grants
-- =========================================================
grant usage on schema public to anon, authenticated;

grant select on public.courses, public.lessons, public.exams, public.reviews to anon;
grant select on public.profiles, public.courses, public.lessons, public.enrollments,
  public.lesson_progress, public.exams, public.exam_questions, public.exam_attempts,
  public.certificates, public.payments, public.reviews to authenticated;

grant insert, update, delete on public.lesson_progress, public.reviews to authenticated;
grant insert, update, delete on public.courses, public.lessons, public.exams,
  public.exam_questions, public.certificates to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
