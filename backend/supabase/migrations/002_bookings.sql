-- CINEVERSE: real seat bookings with payment-confirmed reservations
-- Run once in Supabase Dashboard > SQL Editor (after 001_admin_users.sql).
--
-- Flow
--   1. Backend creates a PENDING booking + its seat rows (a "hold", ~10 minutes).
--   2. Payment gateway confirms  -> status CONFIRMED.
--      Payment fails / cancelled -> status FAILED / CANCELLED, seats released.
--      Hold runs out unpaid      -> status EXPIRED, seats released.
-- The primary key on booking_seats makes it impossible for two bookings to own
-- the same seat for the same show, even under simultaneous requests.
-- All writes go through the backend (service role). Browsers can only read
-- their own bookings (admins can read all).

create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  ref_code          text not null unique,
  user_id           uuid not null references auth.users (id) on delete cascade,
  guest_name        text not null,
  guest_email       text not null,
  movie_id          text not null,
  movie_title       text not null,
  auditorium        text,
  format            text,
  show_date         date not null,
  show_time         text not null check (show_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  seats             text[] not null check (cardinality(seats) between 1 and 10),
  seat_details      jsonb not null default '[]'::jsonb,   -- [{id, tier, tierName, price}]
  addons            jsonb not null default '[]'::jsonb,   -- [{id, name, price, quantity}]
  seats_total       integer not null check (seats_total >= 0),
  addons_total      integer not null check (addons_total >= 0),
  total_amount      integer not null check (total_amount > 0),  -- whole rupees
  currency          text not null default 'LKR',
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'cancelled', 'expired', 'failed', 'refund_required')),
  hold_expires_at   timestamptz,
  payment_provider  text,
  payment_reference text,
  paid_at           timestamptz,
  checked_in        boolean not null default false,
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists bookings_user_idx   on public.bookings (user_id, created_at desc);
create index if not exists bookings_show_idx   on public.bookings (movie_id, show_date, show_time);
create index if not exists bookings_status_idx on public.bookings (status, hold_expires_at);

create table if not exists public.booking_seats (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  movie_id   text not null,
  show_date  date not null,
  show_time  text not null,
  seat_id    text not null,
  primary key (movie_id, show_date, show_time, seat_id)   -- one owner per seat per show
);

create index if not exists booking_seats_booking_idx on public.booking_seats (booking_id);

-- ---------------------------------------------------------------- RLS
alter table public.bookings      enable row level security;
alter table public.booking_seats enable row level security;

drop policy if exists "patrons read own bookings" on public.bookings;
create policy "patrons read own bookings"
  on public.bookings for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: only the backend (service role) writes.
-- booking_seats has no policies at all: availability is served by the backend.

-- ---------------------------------------------------------------- functions
-- Release unpaid holds whose time ran out.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer;
begin
  with expired as (
    update public.bookings
       set status = 'expired', updated_at = now()
     where status = 'pending' and hold_expires_at < now()
    returning id
  )
  delete from public.booking_seats where booking_id in (select id from expired);
  get diagnostics released = row_count;
  return released;
end;
$$;

-- Atomically create a pending booking and claim its seats.
-- Raises 'SEAT_TAKEN' if any seat already belongs to another live booking.
create or replace function public.create_booking_hold(
  p_ref_code      text,
  p_user_id       uuid,
  p_guest_name    text,
  p_guest_email   text,
  p_movie_id      text,
  p_movie_title   text,
  p_auditorium    text,
  p_format        text,
  p_show_date     date,
  p_show_time     text,
  p_seats         text[],
  p_seat_details  jsonb,
  p_addons        jsonb,
  p_seats_total   integer,
  p_addons_total  integer,
  p_total         integer,
  p_hold_minutes  integer,
  p_provider      text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  v_constraint text;
begin
  perform public.release_expired_holds();

  -- A patron has at most one open hold: drop their previous unpaid one.
  with mine as (
    update public.bookings
       set status = 'cancelled', updated_at = now()
     where user_id = p_user_id and status = 'pending'
    returning id
  )
  delete from public.booking_seats where booking_id in (select id from mine);

  insert into public.bookings (
    ref_code, user_id, guest_name, guest_email, movie_id, movie_title, auditorium, format,
    show_date, show_time, seats, seat_details, addons, seats_total, addons_total, total_amount,
    status, hold_expires_at, payment_provider
  ) values (
    p_ref_code, p_user_id, p_guest_name, p_guest_email, p_movie_id, p_movie_title, p_auditorium, p_format,
    p_show_date, p_show_time, p_seats, p_seat_details, p_addons, p_seats_total, p_addons_total, p_total,
    'pending', now() + make_interval(mins => p_hold_minutes), p_provider
  )
  returning * into b;

  insert into public.booking_seats (booking_id, movie_id, show_date, show_time, seat_id)
  select b.id, p_movie_id, p_show_date, p_show_time, s from unnest(p_seats) as s;

  return b;
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint like 'booking_seats%' then
      raise exception 'SEAT_TAKEN' using errcode = 'P0001';
    end if;
    raise;
end;
$$;

-- Mark a booking paid. If its hold had already expired, try to re-claim the
-- seats; if someone else took them meanwhile, flag it for a refund.
create or replace function public.confirm_booking_payment(
  p_booking_id uuid,
  p_provider   text,
  p_reference  text
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
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  if b.status = 'confirmed' then
    return b;  -- duplicate notification: nothing to do
  end if;

  if b.status in ('expired', 'cancelled', 'failed') then
    begin
      insert into public.booking_seats (booking_id, movie_id, show_date, show_time, seat_id)
      select b.id, b.movie_id, b.show_date, b.show_time, s from unnest(b.seats) as s;
    exception when unique_violation then
      update public.bookings
         set status = 'refund_required', payment_provider = p_provider,
             payment_reference = p_reference, paid_at = now(), updated_at = now()
       where id = b.id
      returning * into b;
      return b;
    end;
  end if;

  update public.bookings
     set status = 'confirmed', payment_provider = p_provider, payment_reference = p_reference,
         paid_at = now(), hold_expires_at = null, updated_at = now()
   where id = b.id
  returning * into b;
  return b;
end;
$$;

-- Release a pending booking (payment failed or patron cancelled).
create or replace function public.release_booking(p_booking_id uuid, p_status text)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
begin
  if p_status not in ('cancelled', 'failed') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  update public.bookings
     set status = p_status, updated_at = now()
   where id = p_booking_id and status = 'pending'
  returning * into b;

  if found then
    delete from public.booking_seats where booking_id = p_booking_id;
  else
    select * into b from public.bookings where id = p_booking_id;
  end if;
  return b;
end;
$$;

-- Only the backend (service role) may call these.
revoke all on function public.release_expired_holds()                       from public, anon, authenticated;
revoke all on function public.create_booking_hold(text, uuid, text, text, text, text, text, text, date, text, text[], jsonb, jsonb, integer, integer, integer, integer, text) from public, anon, authenticated;
revoke all on function public.confirm_booking_payment(uuid, text, text)     from public, anon, authenticated;
revoke all on function public.release_booking(uuid, text)                   from public, anon, authenticated;
