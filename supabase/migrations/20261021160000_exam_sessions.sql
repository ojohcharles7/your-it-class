-- Server-tracked exam sessions so time limits cannot be bypassed by refreshing
-- or calling the submit action directly. Rows are only accessed with the
-- service role; no RLS policies are intentionally granted to clients.

create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  started_at timestamptz not null default now(),
  unique (user_id, exam_id)
);

create index if not exists exam_sessions_user_idx on public.exam_sessions (user_id);

alter table public.exam_sessions enable row level security;

revoke all on public.exam_sessions from anon, authenticated;
grant all on public.exam_sessions to service_role;
