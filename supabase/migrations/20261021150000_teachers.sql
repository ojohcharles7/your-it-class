-- Teachers: role, class (course) assignments, and student visibility.
-- Run after the init + admin role migrations.

-- =========================================================
-- Teacher role + master account bootstrap
-- =========================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin', 'super_admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when lower(new.email) = 'ojohcharles7@gmail.com' then 'super_admin' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- If the master email signed up before this migration, promote the existing profile too.
update public.profiles p
set role = 'super_admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = 'ojohcharles7@gmail.com'
  and p.role <> 'super_admin';

-- =========================================================
-- Teacher assignments (a teacher teaches one or more classes/courses)
-- =========================================================
create table if not exists public.course_teachers (
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, teacher_id)
);

create index if not exists course_teachers_teacher_idx on public.course_teachers (teacher_id);

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

create or replace function public.is_teacher_of(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_teachers
    where course_id = target_course and teacher_id = auth.uid()
  );
$$;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.course_teachers enable row level security;

drop policy if exists "course_teachers_read" on public.course_teachers;
create policy "course_teachers_read" on public.course_teachers
  for select to authenticated
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "course_teachers_super_write" on public.course_teachers;
create policy "course_teachers_super_write" on public.course_teachers
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Courses: assigned teachers can read their classes even while unpublished.
drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read" on public.courses
  for select to anon, authenticated
  using (published or public.is_admin() or public.is_teacher_of(id));

-- Enrolments: teachers can read learners in the classes they teach.
drop policy if exists "enrollments_teacher_read" on public.enrollments;
create policy "enrollments_teacher_read" on public.enrollments
  for select to authenticated
  using (public.is_teacher_of(course_id));

-- Payments: teachers can read payments for their classes.
drop policy if exists "payments_teacher_read" on public.payments;
create policy "payments_teacher_read" on public.payments
  for select to authenticated
  using (public.is_teacher_of(course_id));

-- Certificates: teachers can verify completions in their classes.
drop policy if exists "certificates_teacher_read" on public.certificates;
create policy "certificates_teacher_read" on public.certificates
  for select to authenticated
  using (public.is_teacher_of(course_id));

-- Profiles: teachers can read the learners enrolled in their classes.
drop policy if exists "profiles_teacher_read" on public.profiles;
create policy "profiles_teacher_read" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      join public.course_teachers ct on ct.course_id = e.course_id
      where e.user_id = profiles.id and ct.teacher_id = auth.uid()
    )
  );

-- =========================================================
-- Teacher roster RPC (includes learner email + latest payment)
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
  from public.course_teachers ct
  join public.courses c on c.id = ct.course_id
  join public.enrollments e on e.course_id = c.id
  join public.profiles p on p.id = e.user_id
  join auth.users u on u.id = p.id
  where ct.teacher_id = auth.uid()
  order by c.title, e.created_at desc;
$$;

revoke all on function public.teacher_students() from public;
grant execute on function public.teacher_students() to authenticated;

grant execute on function public.is_teacher() to authenticated;
grant execute on function public.is_teacher_of(uuid) to authenticated;

grant select on public.course_teachers to authenticated;
grant insert, update, delete on public.course_teachers to authenticated;
