-- Instructor platform: applications, public profiles, course ownership,
-- course review workflow, earnings ledger and payout requests.
-- Run after 20261023000000_teacher_studio.sql.

-- =========================================================
-- Profiles: learner/instructor profile fields
-- =========================================================
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists avatar_url text;

-- =========================================================
-- Platform settings
-- =========================================================
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('instructor_default_share', to_jsonb(60))
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_admin_read" on public.platform_settings;
create policy "platform_settings_admin_read" on public.platform_settings
  for select to authenticated
  using (public.is_admin());

drop policy if exists "platform_settings_super_write" on public.platform_settings;
create policy "platform_settings_super_write" on public.platform_settings
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, insert, update, delete on public.platform_settings to authenticated;

-- =========================================================
-- Instructor profiles
-- =========================================================
create table if not exists public.instructor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  slug text unique not null,
  headline text not null default '',
  bio text not null default '',
  phone text not null default '',
  website text not null default '',
  avatar_url text,
  expertise text[] not null default '{}',
  is_public boolean not null default true,
  revenue_share_percent integer not null default 60 check (revenue_share_percent between 0 and 100),
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instructor_profiles_slug_idx on public.instructor_profiles (slug);

alter table public.instructor_profiles enable row level security;

drop policy if exists "instructor_profiles_public_read" on public.instructor_profiles;
create policy "instructor_profiles_public_read" on public.instructor_profiles
  for select to anon, authenticated
  using (is_public or user_id = auth.uid() or public.is_admin());

drop policy if exists "instructor_profiles_owner_update" on public.instructor_profiles;
create policy "instructor_profiles_owner_update" on public.instructor_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "instructor_profiles_owner_insert" on public.instructor_profiles;
create policy "instructor_profiles_owner_insert" on public.instructor_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_teacher());

drop policy if exists "instructor_profiles_super_write" on public.instructor_profiles;
create policy "instructor_profiles_super_write" on public.instructor_profiles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, insert, update, delete on public.instructor_profiles to authenticated;
grant select on public.instructor_profiles to anon;

-- Public instructor names are safe to expose on public profile/course pages.
drop policy if exists "profiles_public_instructor_read" on public.profiles;
create policy "profiles_public_instructor_read" on public.profiles
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.instructor_profiles ip
      where ip.user_id = profiles.id and ip.is_public
    )
  );

-- Auto-maintain updated_at.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists instructor_profiles_touch_updated_at on public.instructor_profiles;
create trigger instructor_profiles_touch_updated_at
  before update on public.instructor_profiles
  for each row execute function public.touch_updated_at();

-- =========================================================
-- Instructor applications
-- =========================================================
create table if not exists public.instructor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null default '',
  course_topic text not null,
  experience text not null default '',
  additional_info text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instructor_applications_status_idx
  on public.instructor_applications (status, created_at desc);

create unique index if not exists instructor_applications_pending_email_idx
  on public.instructor_applications (lower(email))
  where status = 'pending';

alter table public.instructor_applications enable row level security;

drop policy if exists "instructor_applications_public_insert" on public.instructor_applications;
create policy "instructor_applications_public_insert" on public.instructor_applications
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "instructor_applications_super_read" on public.instructor_applications;
create policy "instructor_applications_super_read" on public.instructor_applications
  for select to authenticated
  using (public.is_super_admin());

drop policy if exists "instructor_applications_super_update" on public.instructor_applications;
create policy "instructor_applications_super_update" on public.instructor_applications
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant insert on public.instructor_applications to anon, authenticated;
grant select, update on public.instructor_applications to authenticated;

-- =========================================================
-- Course ownership and approval workflow
-- =========================================================
alter table public.courses add column if not exists instructor_id uuid references public.profiles (id) on delete set null;
alter table public.courses add column if not exists review_status text not null default 'draft';
alter table public.courses add column if not exists submitted_at timestamptz;
alter table public.courses add column if not exists reviewed_at timestamptz;
alter table public.courses add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;
alter table public.courses add column if not exists review_note text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_review_status_check'
  ) then
    alter table public.courses
      add constraint courses_review_status_check
      check (review_status in ('draft', 'pending', 'published', 'rejected'));
  end if;
end $$;

update public.courses
set review_status = case when published then 'published' else 'draft' end
where review_status = 'draft';

-- A course with exactly one assigned teacher gets that teacher as its owner.
with single_teacher as (
  select course_id, (array_agg(teacher_id))[1] as teacher_id
  from public.course_teachers
  group by course_id
  having count(*) = 1
)
update public.courses c
set instructor_id = s.teacher_id
from single_teacher s
where c.id = s.course_id and c.instructor_id is null;

create index if not exists courses_instructor_idx on public.courses (instructor_id);
create index if not exists courses_review_status_idx on public.courses (review_status, created_at desc);

-- Owner/assistant lookup.
create or replace function public.is_teacher_of(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.courses c
    where c.id = target_course and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.course_teachers ct
    where ct.course_id = target_course and ct.teacher_id = auth.uid()
  );
$$;

-- Keep published + review_status consistent and prevent teachers from
-- self-publishing or changing ownership through a direct write.
create or replace function public.sync_course_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') <> 'service_role'
       and not public.is_admin()
       and public.is_teacher() then
      new.instructor_id := auth.uid();
      new.review_status := 'draft';
      new.published := false;
    end if;

    if new.review_status is null then
      new.review_status := case when new.published then 'published' else 'draft' end;
    end if;
    new.published := new.review_status = 'published';
    return new;
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin()
     and public.is_teacher() then
    new.instructor_id := old.instructor_id;
    new.review_status := old.review_status;
    new.published := old.published;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    new.review_note := old.review_note;
  end if;

  if new.published is distinct from old.published
     and new.review_status is not distinct from old.review_status then
    new.review_status := case when new.published then 'published' else 'draft' end;
  else
    new.published := new.review_status = 'published';
  end if;

  return new;
end;
$$;

drop trigger if exists courses_sync_workflow_insert on public.courses;
create trigger courses_sync_workflow_insert
  before insert on public.courses
  for each row execute function public.sync_course_workflow();

drop trigger if exists courses_sync_workflow_update on public.courses;
create trigger courses_sync_workflow_update
  before update on public.courses
  for each row execute function public.sync_course_workflow();

-- Replace the broad teacher write policies from the teacher studio migration.
drop policy if exists "courses_teacher_insert" on public.courses;
create policy "courses_teacher_insert" on public.courses
  for insert to authenticated
  with check (
    public.is_teacher()
    and instructor_id = auth.uid()
    and review_status in ('draft', 'pending')
    and published = false
  );

drop policy if exists "courses_teacher_update" on public.courses;
create policy "courses_teacher_update" on public.courses
  for update to authenticated
  using (public.is_teacher_of(id))
  with check (public.is_teacher_of(id));

-- Admins can assign instructors; only master can change ownership.
drop policy if exists "course_teachers_admin_write" on public.course_teachers;
create policy "course_teachers_admin_write" on public.course_teachers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Published courses are public; owners and assistants can read drafts.
drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read" on public.courses
  for select to anon, authenticated
  using (published or public.is_admin() or public.is_teacher_of(id));

-- Teacher content writes (lessons/resources/exams/questions).
drop policy if exists "course_resources_teacher_write" on public.course_resources;
create policy "course_resources_teacher_write" on public.course_resources
  for all to authenticated
  using (public.is_teacher_of(course_id) or public.is_admin())
  with check (public.is_teacher_of(course_id) or public.is_admin());

drop policy if exists "exams_teacher_write" on public.exams;
create policy "exams_teacher_write" on public.exams
  for all to authenticated
  using (public.is_teacher_of(course_id) or public.is_admin())
  with check (public.is_teacher_of(course_id) or public.is_admin());

drop policy if exists "questions_teacher_all" on public.exam_questions;
create policy "questions_teacher_all" on public.exam_questions
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.exams e
      where e.id = exam_questions.exam_id and public.is_teacher_of(e.course_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.exams e
      where e.id = exam_questions.exam_id and public.is_teacher_of(e.course_id)
    )
  );

drop policy if exists "course_materials_teacher_write" on storage.objects;
create policy "course_materials_teacher_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'course-materials'
    and (
      public.is_admin()
      or public.is_teacher_of(((storage.foldername(name))[1])::uuid)
    )
  )
  with check (
    bucket_id = 'course-materials'
    and (
      public.is_admin()
      or public.is_teacher_of(((storage.foldername(name))[1])::uuid)
    )
  );

-- =========================================================
-- Earnings ledger
-- =========================================================
create table if not exists public.instructor_earnings (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  gross_kobo integer not null check (gross_kobo >= 0),
  share_percent integer not null check (share_percent between 0 and 100),
  amount_kobo integer not null check (amount_kobo >= 0),
  created_at timestamptz not null default now()
);

create index if not exists instructor_earnings_instructor_idx
  on public.instructor_earnings (instructor_id, created_at desc);
create index if not exists instructor_earnings_course_idx
  on public.instructor_earnings (course_id);

alter table public.instructor_earnings enable row level security;

drop policy if exists "instructor_earnings_owner_read" on public.instructor_earnings;
create policy "instructor_earnings_owner_read" on public.instructor_earnings
  for select to authenticated
  using (instructor_id = auth.uid() or public.is_admin());

grant select on public.instructor_earnings to authenticated;

create or replace function public.sync_instructor_earning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor uuid;
  v_share integer;
begin
  if new.status = 'success' then
    select instructor_id into v_instructor
    from public.courses
    where id = new.course_id;

    if v_instructor is not null then
      select revenue_share_percent into v_share
      from public.instructor_profiles
      where user_id = v_instructor;

      v_share := coalesce(v_share, 60);

      insert into public.instructor_earnings (
        payment_id, instructor_id, course_id, gross_kobo, share_percent, amount_kobo
      )
      values (
        new.id, v_instructor, new.course_id, new.amount_kobo, v_share,
        floor(new.amount_kobo * v_share / 100.0)::integer
      )
      on conflict (payment_id) do update
      set instructor_id = excluded.instructor_id,
          course_id = excluded.course_id,
          gross_kobo = excluded.gross_kobo,
          share_percent = excluded.share_percent,
          amount_kobo = excluded.amount_kobo;
    else
      delete from public.instructor_earnings where payment_id = new.id;
    end if;
  else
    delete from public.instructor_earnings where payment_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_instructor_earning on public.payments;
create trigger payments_sync_instructor_earning
  after insert or update of status, amount_kobo, course_id on public.payments
  for each row execute function public.sync_instructor_earning();

-- Backfill existing successful payments for courses that now have an owner.
insert into public.instructor_earnings (
  payment_id, instructor_id, course_id, gross_kobo, share_percent, amount_kobo
)
select
  p.id,
  c.instructor_id,
  p.course_id,
  p.amount_kobo,
  coalesce(ip.revenue_share_percent, 60),
  floor(p.amount_kobo * coalesce(ip.revenue_share_percent, 60) / 100.0)::integer
from public.payments p
join public.courses c on c.id = p.course_id
left join public.instructor_profiles ip on ip.user_id = c.instructor_id
where p.status = 'success' and c.instructor_id is not null
on conflict (payment_id) do nothing;

-- =========================================================
-- Payout requests
-- =========================================================
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  amount_kobo integer not null check (amount_kobo > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  note text not null default '',
  review_note text not null default '',
  reference text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payout_requests_instructor_idx
  on public.payout_requests (instructor_id, created_at desc);
create index if not exists payout_requests_status_idx
  on public.payout_requests (status, created_at desc);

alter table public.payout_requests enable row level security;

drop policy if exists "payout_requests_owner_read" on public.payout_requests;
create policy "payout_requests_owner_read" on public.payout_requests
  for select to authenticated
  using (instructor_id = auth.uid() or public.is_admin());

drop policy if exists "payout_requests_super_write" on public.payout_requests;
create policy "payout_requests_super_write" on public.payout_requests
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on public.payout_requests to authenticated;

create or replace function public.instructor_available_balance(target_instructor uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    coalesce((
      select sum(amount_kobo) from public.instructor_earnings
      where instructor_id = target_instructor
    ), 0)
    - coalesce((
      select sum(amount_kobo) from public.payout_requests
      where instructor_id = target_instructor
        and status in ('pending', 'approved', 'paid')
    ), 0),
    0
  )::integer;
$$;

create or replace function public.request_payout(p_amount_kobo integer, p_note text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor uuid := auth.uid();
  v_available integer;
  v_profile public.instructor_profiles%rowtype;
  v_id uuid;
begin
  if v_instructor is null then
    raise exception 'You must be signed in to request a payout.';
  end if;
  if p_amount_kobo is null or p_amount_kobo <= 0 then
    raise exception 'Enter a valid payout amount.';
  end if;

  select * into v_profile from public.instructor_profiles where user_id = v_instructor;
  if not found then
    raise exception 'Complete your instructor profile before requesting a payout.';
  end if;
  if coalesce(v_profile.bank_name, '') = ''
     or coalesce(v_profile.account_name, '') = ''
     or coalesce(v_profile.account_number, '') = '' then
    raise exception 'Add your bank details before requesting a payout.';
  end if;

  select public.instructor_available_balance(v_instructor) into v_available;
  if p_amount_kobo > v_available then
    raise exception 'You can request at most % kobo.', v_available;
  end if;

  insert into public.payout_requests (
    instructor_id, amount_kobo, bank_name, account_name, account_number, note
  )
  values (
    v_instructor, p_amount_kobo, v_profile.bank_name, v_profile.account_name,
    v_profile.account_number, coalesce(p_note, '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.instructor_available_balance(uuid) to authenticated;
grant execute on function public.request_payout(integer, text) to authenticated;

-- =========================================================
-- Teacher roster RPC: include course owners as well as assistants
-- =========================================================
create or replace function public.teacher_students()
returns table (
  user_id uuid,
  full_name text,
  email text,
  course_id uuid,
  course_title text,
  course_slug text,
  enrolled_at timestamptz,
  amount_kobo integer,
  payment_status text,
  enrollment_status text
)
language sql
stable
security definer
set search_path = public
as $$
  with taught as (
    select c.id, c.title, c.slug
    from public.courses c
    where c.instructor_id = auth.uid()
    union
    select c.id, c.title, c.slug
    from public.course_teachers ct
    join public.courses c on c.id = ct.course_id
    where ct.teacher_id = auth.uid()
  )
  select
    p.id,
    p.full_name,
    u.email::text,
    c.id,
    c.title,
    c.slug,
    e.created_at,
    e.amount_kobo,
    coalesce(
      (
        select pay.status
        from public.payments pay
        where pay.user_id = e.user_id and pay.course_id = c.id
        order by pay.created_at desc
        limit 1
      ),
      'pending'
    ),
    e.status
  from taught c
  join public.enrollments e on e.course_id = c.id
  join public.profiles p on p.id = e.user_id
  join auth.users u on u.id = p.id
  order by c.title, e.created_at desc;
$$;

revoke all on function public.teacher_students() from public;
grant execute on function public.teacher_students() to authenticated;

grant execute on function public.is_teacher_of(uuid) to authenticated;

-- =========================================================
-- Storage: instructor avatars
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instructor-avatars',
  'instructor-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "instructor_avatars_public_read" on storage.objects;
create policy "instructor_avatars_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'instructor-avatars');

drop policy if exists "instructor_avatars_owner_write" on storage.objects;
create policy "instructor_avatars_owner_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'instructor-avatars'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'instructor-avatars'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Refresh PostgREST schema cache so new columns/policies are visible immediately.
notify pgrst, 'reload schema';
