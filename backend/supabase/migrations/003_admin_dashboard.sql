-- CINEVERSE: data behind the admin dashboard
-- Run once in Supabase Dashboard > SQL Editor (after 002_bookings.sql). Safe to run again.
--
-- 1. movies:       anyone can read; only the backend (service role) can write.
-- 2. auditoriums:  hall settings (status, projector, sound, lights, temperature).
-- 3. bookings:     in-seat service (concierge) delivery status per booking.

-- ---------------------------------------------------------------- 1. movies
alter table public.movies add column if not exists updated_at timestamptz not null default now();

alter table public.movies enable row level security;

-- Remove every existing policy (earlier versions let the browser write directly).
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'movies' loop
    execute format('drop policy %I on public.movies', p.policyname);
  end loop;
end $$;

create policy "anyone can read movies"
  on public.movies for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: films are managed through the admin API.

-- ---------------------------------------------------------------- 2. auditoriums
create table if not exists public.auditoriums (
  id              text primary key,                -- 'aud-01'
  number          text not null unique,            -- '01'
  name            text not null,
  format          text not null default '',
  projection      text not null default '',
  sound           text not null default '',
  status          text not null default 'Standby'
                  check (status in ('Live Screening', 'Intermission', 'Cleaning', 'Standby')),
  projector_on    boolean not null default false,
  audio_preset    text not null default 'Dolby Atmos 64-Ch'
                  check (audio_preset in ('Dolby Atmos 64-Ch', '70mm 6-Track', 'Dialogue Boost')),
  lighting_preset text not null default 'Ambient 40%'
                  check (lighting_preset in ('Dim 5%', 'Ambient 40%', 'Full 100%')),
  temperature     numeric(3, 1) not null default 21.0 check (temperature between 17 and 26),
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now()
);

alter table public.auditoriums enable row level security;
-- No policies: read and written only by the backend.

insert into public.auditoriums
  (id, number, name, format, projection, sound, status, projector_on, audio_preset, lighting_preset, temperature, sort_order)
values
  ('aud-01', '01', 'The Sovereign Soundstage', '70MM DUAL LASER • DOLBY ATMOS',
   'Christie CP4450-RGB Pure Laser 70mm Architecture', '64-Channel Dolby Atmos Spatial Soundstage',
   'Standby', true, 'Dolby Atmos 64-Ch', 'Ambient 40%', 20.5, 1),
  ('aud-02', '02', 'The Director’s Loge', '70MM ULTRA PANAVISION • 6-TRACK STEREO',
   'Restored 70mm Kinoton Mechanical Archival Projector', 'Discrete 6-Track Magnetic Sound Reproduction',
   'Standby', true, '70mm 6-Track', 'Ambient 40%', 21.0, 2),
  ('aud-03', '03', 'The Quantum Chamber', '10TH ANNIVERSARY 70MM PRESENTATION',
   'Barco 4K Laser with 70mm High-Luminance Lens Array', 'Custom Acoustics with Dual Sub-Bass Arrays',
   'Standby', false, 'Dialogue Boost', 'Full 100%', 22.0, 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- 3. concierge
alter table public.bookings
  add column if not exists concierge_status text not null default 'Pending';
alter table public.bookings
  add column if not exists concierge_updated_at timestamptz;

alter table public.bookings drop constraint if exists bookings_concierge_status_check;
alter table public.bookings
  add constraint bookings_concierge_status_check
  check (concierge_status in ('Pending', 'Preparing', 'Delivered'));

create index if not exists bookings_paid_idx on public.bookings (status, paid_at desc);
