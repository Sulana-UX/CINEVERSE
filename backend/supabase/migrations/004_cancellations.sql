-- CINEVERSE: guests can cancel paid bookings; refunds are tracked until staff pay them back.
-- Run once in Supabase Dashboard > SQL Editor (after 003_admin_dashboard.sql). Safe to run again.
--
-- refund_status
--   null            no refund involved (booking never paid, or still active)
--   pending         money is owed to the guest; staff refund it in the payment portal
--   refunded        staff confirmed the money was returned
--   not_applicable  cancelled with a 0% refund

alter table public.bookings add column if not exists cancelled_at      timestamptz;
alter table public.bookings add column if not exists cancelled_by      text;
alter table public.bookings add column if not exists refund_amount     integer;
alter table public.bookings add column if not exists refund_status     text;
alter table public.bookings add column if not exists refunded_at       timestamptz;
alter table public.bookings add column if not exists refund_reference  text;

alter table public.bookings drop constraint if exists bookings_refund_status_check;
alter table public.bookings
  add constraint bookings_refund_status_check
  check (refund_status is null or refund_status in ('pending', 'refunded', 'not_applicable'));

alter table public.bookings drop constraint if exists bookings_refund_amount_check;
alter table public.bookings
  add constraint bookings_refund_amount_check
  check (refund_amount is null or (refund_amount >= 0 and refund_amount <= total_amount));

alter table public.bookings drop constraint if exists bookings_cancelled_by_check;
alter table public.bookings
  add constraint bookings_cancelled_by_check
  check (cancelled_by is null or cancelled_by in ('guest', 'staff'));

create index if not exists bookings_refund_idx on public.bookings (refund_status) where refund_status = 'pending';

-- Payments that arrived after their seats were re-sold are owed in full.
update public.bookings
   set refund_status = 'pending', refund_amount = total_amount
 where status = 'refund_required' and refund_status is null;

-- Cancel a confirmed booking: frees its seats and records the refund owed.
-- The row lock stops a double cancel or a cancel racing a door check-in.
create or replace function public.cancel_paid_booking(
  p_booking_id    uuid,
  p_refund_amount integer,
  p_cancelled_by  text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if b.status <> 'confirmed' then
    raise exception 'NOT_CANCELLABLE';
  end if;
  if b.checked_in then
    raise exception 'ALREADY_CHECKED_IN';
  end if;

  delete from public.booking_seats where booking_id = b.id;

  update public.bookings
     set status        = 'cancelled',
         cancelled_at  = now(),
         cancelled_by  = p_cancelled_by,
         refund_amount = p_refund_amount,
         refund_status = case when p_refund_amount > 0 then 'pending' else 'not_applicable' end,
         updated_at    = now()
   where id = b.id
  returning * into b;

  return b;
end;
$$;

revoke all on function public.cancel_paid_booking(uuid, integer, text) from public, anon, authenticated;
