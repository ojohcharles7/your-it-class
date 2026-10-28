-- LearnHub: course modules, lesson Q&A and course announcements.
-- Run after 20261025000000_resource_books.sql.

-- =========================================================
-- Course modules
-- =========================================================
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists course_modules_course_position_idx
  on public.course_modules (course_id, position);

alter table public.lessons add column if not exists module_id uuid references public.course_modules (id) on delete set null;
create index if not exists lessons_module_position_idx on public.lessons (module_id, position);

-- Keep existing courses usable: create one module and attach their lessons.
do $$
declare
  course_row record;
  new_module_id uuid;
begin
  for course_row in
    select distinct course_id from public.lessons where module_id is null
  loop
    insert into public.course_modules (course_id, title, position)
    values (course_row.course_id, 'Course content', 1)
    returning id into new_module_id;

    update public.lessons
    set module_id = new_module_id
    where course_id = course_row.course_id and module_id is null;
  end loop;
end $$;

alter table public.course_modules enable row level security;

drop policy if exists "course_modules_public_read" on public.course_modules;
create policy "course_modules_public_read" on public.course_modules
  for select to anon, authenticated
  using (
    public.is_admin()
    or public.is_teacher_of(course_id)
    or exists (
      select 1 from public.courses c
      where c.id = course_modules.course_id and c.published
    )
  );

drop policy if exists "course_modules_teacher_write" on public.course_modules;
create policy "course_modules_teacher_write" on public.course_modules
  for all to authenticated
  using (public.is_admin() or public.is_teacher_of(course_id))
  with check (public.is_admin() or public.is_teacher_of(course_id));

-- =========================================================
-- Lesson Q&A
-- =========================================================
create table if not exists public.course_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  resolved boolean not null default false,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists course_questions_course_idx
  on public.course_questions (course_id, created_at desc);
create index if not exists course_questions_lesson_idx
  on public.course_questions (lesson_id, created_at desc);

create table if not exists public.course_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.course_questions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists course_answers_question_idx
  on public.course_answers (question_id, created_at);

create or replace function public.is_enrolled_in(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid() and course_id = target_course
  );
$$;

grant execute on function public.is_enrolled_in(uuid) to authenticated;

alter table public.course_questions enable row level security;
alter table public.course_answers enable row level security;

drop policy if exists "course_questions_read" on public.course_questions;
create policy "course_questions_read" on public.course_questions
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_teacher_of(course_id)
    or public.is_enrolled_in(course_id)
  );

drop policy if exists "course_questions_insert" on public.course_questions;
create policy "course_questions_insert" on public.course_questions
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_enrolled_in(course_id));

drop policy if exists "course_questions_resolve" on public.course_questions;
create policy "course_questions_resolve" on public.course_questions
  for update to authenticated
  using (public.is_admin() or public.is_teacher_of(course_id))
  with check (public.is_admin() or public.is_teacher_of(course_id));

drop policy if exists "course_answers_read" on public.course_answers;
create policy "course_answers_read" on public.course_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.course_questions q
      where q.id = course_answers.question_id
        and (
          q.user_id = auth.uid()
          or public.is_admin()
          or public.is_teacher_of(q.course_id)
          or public.is_enrolled_in(q.course_id)
        )
    )
  );

drop policy if exists "course_answers_insert" on public.course_answers;
create policy "course_answers_insert" on public.course_answers
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_questions q
      where q.id = course_answers.question_id
        and (
          public.is_admin()
          or public.is_teacher_of(q.course_id)
          or public.is_enrolled_in(q.course_id)
        )
    )
  );

drop policy if exists "course_answers_delete" on public.course_answers;
create policy "course_answers_delete" on public.course_answers
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_teacher_of(
    (select q.course_id from public.course_questions q where q.id = course_answers.question_id)
  ));

-- =========================================================
-- Course announcements
-- =========================================================
create table if not exists public.course_announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 2 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists course_announcements_course_idx
  on public.course_announcements (course_id, created_at desc);

alter table public.course_announcements enable row level security;

drop policy if exists "course_announcements_read" on public.course_announcements;
create policy "course_announcements_read" on public.course_announcements
  for select to authenticated
  using (
    public.is_admin()
    or public.is_teacher_of(course_id)
    or public.is_enrolled_in(course_id)
  );

drop policy if exists "course_announcements_write" on public.course_announcements;
create policy "course_announcements_write" on public.course_announcements
  for all to authenticated
  using (public.is_admin() or public.is_teacher_of(course_id))
  with check (public.is_admin() or public.is_teacher_of(course_id));

grant select, insert on public.course_questions to authenticated;
grant update (resolved, resolved_by, resolved_at) on public.course_questions to authenticated;
grant select, insert, delete on public.course_answers to authenticated;
grant select, insert, update, delete on public.course_modules to authenticated;
grant select on public.course_modules to anon;
grant select, insert, update, delete on public.course_announcements to authenticated;

notify pgrst, 'reload schema';
