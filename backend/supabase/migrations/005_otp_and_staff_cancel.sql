-- CINEVERSE: sign-up codes in the database, and staff cancellations with a reason.
-- Run once in Supabase Dashboard > SQL Editor (after 004_cancellations.sql). Safe to run again.

-- ---------------------------------------------------------------- 1. email verification codes
-- Codes survive a server restart and work when several API servers run.
-- Only a salted SHA-256 hash of each code is stored, never the code itself.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.otp_codes (
  email        text primary key,
  code_hash    text not null,
  salt         text not null,
  attempts     integer not null default 0,
  expires_at   timestamptz not null,
  last_sent_at timestamptz not null default now()
);

alter table public.otp_codes enable row level security;
-- No policies: only the backend (service role) uses this table.

-- Store a new code for an email unless one was sent in the last p_cooldown_seconds.
-- Returns 0 when issued, otherwise the seconds left to wait.
create or replace function public.issue_otp(
  p_email            text,
  p_code             text,
  p_ttl_seconds      integer,
  p_cooldown_seconds integer
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  existing public.otp_codes;
  wait_seconds integer;
  new_salt text := encode(gen_random_bytes(16), 'hex');
begin
  -- Housekeeping: forget codes that expired more than a day ago.
  delete from public.otp_codes where expires_at < now() - interval '1 day';

  select * into existing from public.otp_codes where email = p_email for update;
  if found then
    wait_seconds := ceil(extract(epoch from (existing.last_sent_at + make_interval(secs => p_cooldown_seconds) - now())));
    if wait_seconds > 0 then
      return wait_seconds;
    end if;
  end if;

  insert into public.otp_codes (email, code_hash, salt, attempts, expires_at, last_sent_at)
  values (
    p_email,
    encode(digest(new_salt || ':' || p_code, 'sha256'), 'hex'),
    new_salt,
    0,
    now() + make_interval(secs => p_ttl_seconds),
    now()
  )
  on conflict (email) do update
    set code_hash = excluded.code_hash,
        salt = excluded.salt,
        attempts = 0,
        expires_at = excluded.expires_at,
        last_sent_at = excluded.last_sent_at;
  return 0;
end;
$$;

-- Check a code. Every check counts as an attempt (the row lock makes this safe
-- under parallel requests). A correct code is deleted when p_consume is true.
-- Returns 'ok', 'not_found', 'expired', 'too_many' or 'wrong'.
create or replace function public.check_otp(
  p_email        text,
  p_code         text,
  p_max_attempts integer,
  p_consume      boolean
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  rec public.otp_codes;
begin
  select * into rec from public.otp_codes where email = p_email for update;
  if not found then
    return 'not_found';
  end if;
  if rec.expires_at < now() then
    delete from public.otp_codes where email = p_email;
    return 'expired';
  end if;
  if rec.attempts >= p_max_attempts then
    delete from public.otp_codes where email = p_email;
    return 'too_many';
  end if;

  update public.otp_codes set attempts = attempts + 1 where email = p_email;

  if rec.code_hash <> encode(digest(rec.salt || ':' || p_code, 'sha256'), 'hex') then
    return 'wrong';
  end if;
  if p_consume then
    delete from public.otp_codes where email = p_email;
  end if;
  return 'ok';
end;
$$;

revoke all on function public.issue_otp(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.check_otp(text, text, integer, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------- 2. staff cancellations
alter table public.bookings add column if not exists cancel_reason text;
