-- Teacher studio: teachers can create classes they teach and upload video lessons.
-- Run after 20261021150000_teachers.sql.

-- =========================================================
-- Lesson video uploads
-- =========================================================
alter table public.lessons add column if not exists video_path text;
alter table public.lessons add column if not exists video_mime text;
alter table public.lessons add column if not exists video_size bigint;

comment on column public.lessons.video_path is 'Path in the private course-videos Storage bucket. Empty when the lesson uses youtube_id.';
comment on column public.lessons.video_mime is 'MIME type of the uploaded lesson video.';
comment on column public.lessons.video_size is 'Size in bytes of the uploaded lesson video.';

-- =========================================================
-- Teacher write access for their assigned classes
-- =========================================================
drop policy if exists "courses_teacher_insert" on public.courses;
create policy "courses_teacher_insert" on public.courses
  for insert to authenticated
  with check (public.is_teacher());

drop policy if exists "courses_teacher_update" on public.courses;
create policy "courses_teacher_update" on public.courses
  for update to authenticated
  using (public.is_teacher_of(id))
  with check (public.is_teacher_of(id));

drop policy if exists "lessons_teacher_all" on public.lessons;
create policy "lessons_teacher_all" on public.lessons
  for all to authenticated
  using (public.is_teacher_of(course_id))
  with check (public.is_teacher_of(course_id));

-- =========================================================
-- Storage bucket for uploaded lesson videos
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  false,
  524288000,
  array[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-m4v'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_videos_admin_write" on storage.objects;
create policy "course_videos_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-videos' and public.is_admin())
  with check (bucket_id = 'course-videos' and public.is_admin());

drop policy if exists "course_videos_teacher_write" on storage.objects;
create policy "course_videos_teacher_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'course-videos'
    and public.is_teacher_of(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'course-videos'
    and public.is_teacher_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "course_videos_read" on storage.objects;
create policy "course_videos_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-videos'
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

-- Refresh PostgREST schema cache so new columns/policies are visible immediately.
notify pgrst, 'reload schema';
