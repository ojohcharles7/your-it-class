-- Remove the super_admin role. All former super admins become regular admins.

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles disable trigger protect_profile_role;

update public.profiles
set role = 'admin'
where role = 'super_admin';

alter table public.profiles enable trigger protect_profile_role;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

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

-- Keep the legacy helper name for existing policies, but treat it as admin access.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin();
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
     and (not public.is_admin() or new.id = auth.uid()) then
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
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;
