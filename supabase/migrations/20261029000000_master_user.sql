-- Add the master user role and link the configured master account.

alter table public.profiles drop constraint if exists profiles_role_check;

-- Bypass the role-protection trigger while migrating existing roles.
alter table public.profiles disable trigger protect_profile_role;

update public.profiles
set role = 'admin'
where role = 'super_admin';

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Master User'),
  'master'
from auth.users u
where lower(u.email) = 'ojohcharles7@gmail.com'
on conflict (id) do update set role = 'master';

update public.profiles p
set role = 'master'
from auth.users u
where u.id = p.id
  and lower(u.email) = 'ojohcharles7@gmail.com';

alter table public.profiles enable trigger protect_profile_role;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin', 'master'));

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'master')
  );
$$;

-- Legacy name kept for existing policies.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master();
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
     and (not public.is_master() or new.id = auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

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
    case when lower(new.email) = 'ojohcharles7@gmail.com' then 'master' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

grant execute on function public.is_master() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;
