-- Class resources: PDF/DOC/DOCX handouts attached to a course.
-- Files live in the private "course-materials" Storage bucket.

create table if not exists public.course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists course_resources_course_idx on public.course_resources (course_id);

alter table public.course_resources enable row level security;

drop policy if exists "course_resources_read" on public.course_resources;
create policy "course_resources_read" on public.course_resources
  for select to authenticated
  using (
    public.is_admin()
    or public.is_teacher_of(course_id)
    or exists (
      select 1
      from public.enrollments e
      where e.user_id = auth.uid() and e.course_id = course_resources.course_id
    )
  );

drop policy if exists "course_resources_admin_write" on public.course_resources;
create policy "course_resources_admin_write" on public.course_resources
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.course_resources to authenticated;

-- =========================================================
-- Storage bucket for handouts
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-materials',
  'course-materials',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_materials_admin_write" on storage.objects;
create policy "course_materials_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-materials' and public.is_admin())
  with check (bucket_id = 'course-materials' and public.is_admin());

drop policy if exists "course_materials_read" on storage.objects;
create policy "course_materials_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-materials'
    and (
      public.is_admin()
      or public.is_teacher_of(((storage.foldername(name))[1])::uuid)
      or exists (
        select 1
        from public.enrollments e
        where e.user_id = auth.uid()
          and e.course_id::text = (storage.foldername(name))[1]
      )
    )
  );
