-- LearnHub: coupons, referral channels, two-tier instructor shares and payout minimums.
-- Run after 20261026000000_learning_experience.sql.

-- =========================================================
-- Coupons
-- =========================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  course_id uuid references public.courses (id) on delete cascade,
  instructor_id uuid references public.profiles (id) on delete set null,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'amount')),
  discount_value integer not null check (discount_value > 0),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists coupons_code_unique_idx on public.coupons (upper(code));
create index if not exists coupons_course_idx on public.coupons (course_id, active);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete cascade,
  discount_kobo integer not null default 0 check (discount_kobo >= 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id),
  unique (payment_id)
);

create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "coupons_instructor_read" on public.coupons;
create policy "coupons_instructor_read" on public.coupons
  for select to authenticated
  using (instructor_id = auth.uid());

drop policy if exists "coupons_instructor_write" on public.coupons;
create policy "coupons_instructor_write" on public.coupons
  for all to authenticated
  using (instructor_id = auth.uid() and course_id is not null and public.is_teacher_of(course_id))
  with check (instructor_id = auth.uid() and course_id is not null and public.is_teacher_of(course_id));

drop policy if exists "coupon_redemptions_read" on public.coupon_redemptions;
create policy "coupon_redemptions_read" on public.coupon_redemptions
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.coupons c
      where c.id = coupon_redemptions.coupon_id and public.is_teacher_of(c.course_id)
    )
  );

grant select, insert, update, delete on public.coupons to authenticated;
grant select on public.coupon_redemptions to authenticated;

-- =========================================================
-- Payment channel and discount fields
-- =========================================================
alter table public.payments add column if not exists original_amount_kobo integer;
alter table public.payments add column if not exists discount_kobo integer not null default 0;
alter table public.payments add column if not exists coupon_id uuid references public.coupons (id) on delete set null;
alter table public.payments add column if not exists sale_channel text not null default 'marketplace';
alter table public.payments add column if not exists referral_code text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payments_sale_channel_check') then
    alter table public.payments
      add constraint payments_sale_channel_check
      check (sale_channel in ('marketplace', 'referral'));
  end if;
end $$;

update public.payments set original_amount_kobo = amount_kobo where original_amount_kobo is null;

-- =========================================================
-- Two-tier instructor shares
-- =========================================================
alter table public.instructor_profiles add column if not exists marketplace_share_percent integer not null default 50;
alter table public.instructor_profiles add column if not exists referral_share_percent integer not null default 80;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'instructor_profiles_marketplace_share_check') then
    alter table public.instructor_profiles
      add constraint instructor_profiles_marketplace_share_check
      check (marketplace_share_percent between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'instructor_profiles_referral_share_check') then
    alter table public.instructor_profiles
      add constraint instructor_profiles_referral_share_check
      check (referral_share_percent between 0 and 100);
  end if;
end $$;

-- Preserve existing agreed shares instead of silently changing live earnings.
update public.instructor_profiles
set marketplace_share_percent = revenue_share_percent
where marketplace_share_percent = 50 and revenue_share_percent <> 50;

insert into public.platform_settings (key, value)
values
  ('marketplace_share_percent', to_jsonb(50)),
  ('referral_share_percent', to_jsonb(80)),
  ('minimum_payout_kobo', to_jsonb(0))
on conflict (key) do nothing;

alter table public.instructor_earnings add column if not exists sale_channel text not null default 'marketplace';
alter table public.instructor_earnings add column if not exists platform_amount_kobo integer not null default 0;

update public.instructor_earnings
set platform_amount_kobo = greatest(0, gross_kobo - amount_kobo)
where platform_amount_kobo = 0;

create or replace function public.sync_instructor_earning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor uuid;
  v_marketplace_share integer;
  v_referral_share integer;
  v_share integer;
begin
  if new.status = 'success' then
    select instructor_id into v_instructor
    from public.courses
    where id = new.course_id;

    if v_instructor is not null then
      select
        coalesce(marketplace_share_percent, 50),
        coalesce(referral_share_percent, 80)
      into v_marketplace_share, v_referral_share
      from public.instructor_profiles
      where user_id = v_instructor;

      v_marketplace_share := coalesce(v_marketplace_share, 50);
      v_referral_share := coalesce(v_referral_share, 80);
      v_share := case when new.sale_channel = 'referral' then v_referral_share else v_marketplace_share end;

      insert into public.instructor_earnings (
        payment_id, instructor_id, course_id, gross_kobo, share_percent,
        amount_kobo, sale_channel, platform_amount_kobo
      )
      values (
        new.id, v_instructor, new.course_id, new.amount_kobo, v_share,
        floor(new.amount_kobo * v_share / 100.0)::integer,
        new.sale_channel,
        greatest(0, new.amount_kobo - floor(new.amount_kobo * v_share / 100.0)::integer)
      )
      on conflict (payment_id) do update
      set instructor_id = excluded.instructor_id,
          course_id = excluded.course_id,
          gross_kobo = excluded.gross_kobo,
          share_percent = excluded.share_percent,
          amount_kobo = excluded.amount_kobo,
          sale_channel = excluded.sale_channel,
          platform_amount_kobo = excluded.platform_amount_kobo;
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
  after insert or update of status, amount_kobo, course_id, sale_channel on public.payments
  for each row execute function public.sync_instructor_earning();

-- =========================================================
-- Minimum payout threshold
-- =========================================================
create or replace function public.request_payout(p_amount_kobo integer, p_note text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor uuid := auth.uid();
  v_available integer;
  v_minimum integer;
  v_profile public.instructor_profiles%rowtype;
  v_id uuid;
begin
  if v_instructor is null then
    raise exception 'You must be signed in to request a payout.';
  end if;
  if p_amount_kobo is null or p_amount_kobo <= 0 then
    raise exception 'Enter a valid payout amount.';
  end if;

  select coalesce((value #>> '{}')::integer, 0) into v_minimum
  from public.platform_settings
  where key = 'minimum_payout_kobo';
  v_minimum := coalesce(v_minimum, 0);

  if p_amount_kobo < v_minimum then
    raise exception 'The minimum payout is % kobo.', v_minimum;
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

grant execute on function public.request_payout(integer, text) to authenticated;

notify pgrst, 'reload schema';
