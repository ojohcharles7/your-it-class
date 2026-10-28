-- LearnHub: manual bank-transfer proof, admin review and manual payment settings.
-- Run after 20261026100000_commerce.sql.

-- =========================================================
-- Manual payment settings
-- =========================================================
insert into public.platform_settings (key, value)
values (
  'manual_payment_details',
  jsonb_build_object(
    'bank_name', '',
    'account_name', '',
    'account_number', '',
    'instructions', ''
  )
)
on conflict (key) do nothing;

drop policy if exists "platform_settings_manual_read" on public.platform_settings;
create policy "platform_settings_manual_read" on public.platform_settings
  for select to anon, authenticated
  using (key = 'manual_payment_details');

-- =========================================================
-- Payment submissions
-- =========================================================
create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  coupon_id uuid references public.coupons (id) on delete set null,
  original_amount_kobo integer not null check (original_amount_kobo >= 0),
  discount_kobo integer not null default 0 check (discount_kobo >= 0),
  amount_kobo integer not null check (amount_kobo >= 0),
  sale_channel text not null default 'marketplace' check (sale_channel in ('marketplace', 'referral')),
  referral_code text not null default '',
  payer_name text not null check (char_length(payer_name) between 2 and 120),
  payer_phone text not null default '',
  bank_reference text not null check (char_length(bank_reference) between 2 and 120),
  note text not null default '',
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  payment_id uuid unique references public.payments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_submissions_status_idx
  on public.payment_submissions (status, created_at desc);
create index if not exists payment_submissions_user_idx
  on public.payment_submissions (user_id, created_at desc);
create index if not exists payment_submissions_course_idx
  on public.payment_submissions (course_id, created_at desc);
create unique index if not exists payment_submissions_one_pending_idx
  on public.payment_submissions (user_id, course_id)
  where status = 'pending';

alter table public.payment_submissions enable row level security;

drop policy if exists "payment_submissions_owner_read" on public.payment_submissions;
create policy "payment_submissions_owner_read" on public.payment_submissions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payment_submissions_owner_insert" on public.payment_submissions;
create policy "payment_submissions_owner_insert" on public.payment_submissions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.courses c
      where c.id = payment_submissions.course_id and c.published
    )
  );

grant select, insert on public.payment_submissions to authenticated;

-- =========================================================
-- Private proof storage: payment-proofs/<user-id>/<file>
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

drop policy if exists "payment_proofs_owner_read" on storage.objects;
create policy "payment_proofs_owner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "payment_proofs_owner_insert" on storage.objects;
create policy "payment_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_proofs_owner_delete" on storage.objects;
create policy "payment_proofs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- =========================================================
-- Approval RPC: service-role only. Server actions verify the reviewer first.
-- =========================================================
create or replace function public.approve_payment_submission(
  p_submission_id uuid,
  p_reviewer uuid,
  p_amount_kobo integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.payment_submissions%rowtype;
  c public.coupons%rowtype;
  v_amount integer;
  v_reference text;
  v_payment_id uuid;
  v_redemptions integer;
begin
  select * into s from public.payment_submissions where id = p_submission_id for update;
  if not found then
    raise exception 'Payment submission not found.';
  end if;
  if s.status <> 'pending' then
    raise exception 'This payment submission has already been reviewed.';
  end if;

  v_amount := coalesce(p_amount_kobo, s.amount_kobo);
  if v_amount is null or v_amount < 0 then
    raise exception 'Enter a valid approved amount.';
  end if;

  if s.coupon_id is not null then
    select * into c from public.coupons where id = s.coupon_id;
    if not found or not c.active then
      raise exception 'The coupon on this submission is no longer active.';
    end if;
    if c.course_id is not null and c.course_id <> s.course_id then
      raise exception 'The coupon does not apply to this course.';
    end if;
    if c.max_redemptions is not null then
      select count(*) into v_redemptions
      from public.coupon_redemptions
      where coupon_id = c.id;
      if v_redemptions >= c.max_redemptions then
        raise exception 'This coupon has reached its redemption limit.';
      end if;
    end if;
  end if;

  v_reference := 'LH-MAN-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.payments (
    reference, user_id, course_id, amount_kobo, status, provider, raw,
    original_amount_kobo, discount_kobo, coupon_id, sale_channel, referral_code
  )
  values (
    v_reference, s.user_id, s.course_id, v_amount, 'success', 'manual',
    jsonb_build_object(
      'submission_id', s.id,
      'payer_name', s.payer_name,
      'payer_phone', s.payer_phone,
      'bank_reference', s.bank_reference,
      'proof_path', s.proof_path,
      'note', s.note
    ),
    s.original_amount_kobo, s.discount_kobo, s.coupon_id, s.sale_channel, s.referral_code
  )
  returning id into v_payment_id;

  insert into public.enrollments (user_id, course_id, status, amount_kobo, paystack_ref)
  values (s.user_id, s.course_id, 'active', v_amount, v_reference)
  on conflict (user_id, course_id) do update
  set amount_kobo = greatest(public.enrollments.amount_kobo, excluded.amount_kobo),
      paystack_ref = coalesce(public.enrollments.paystack_ref, excluded.paystack_ref);

  if s.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, user_id, payment_id, discount_kobo)
    values (s.coupon_id, s.user_id, v_payment_id, s.discount_kobo);
  end if;

  update public.payment_submissions
  set status = 'approved',
      amount_kobo = v_amount,
      payment_id = v_payment_id,
      reviewed_by = p_reviewer,
      reviewed_at = now(),
      review_note = '',
      updated_at = now()
  where id = s.id;

  return v_payment_id;
end;
$$;

revoke all on function public.approve_payment_submission(uuid, uuid, integer) from public;
revoke all on function public.approve_payment_submission(uuid, uuid, integer) from anon;
revoke all on function public.approve_payment_submission(uuid, uuid, integer) from authenticated;
grant execute on function public.approve_payment_submission(uuid, uuid, integer) to service_role;

notify pgrst, 'reload schema';
