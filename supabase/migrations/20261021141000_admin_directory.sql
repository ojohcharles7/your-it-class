create or replace function public.admin_user_directory()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email::text
  from auth.users u
  where public.is_admin();
$$;

revoke all on function public.admin_user_directory() from public;
grant execute on function public.admin_user_directory() to authenticated;
