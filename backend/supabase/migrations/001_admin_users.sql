-- CINEVERSE: database-backed admin accounts
-- Run once in Supabase Dashboard > SQL Editor.
--
-- Passwords live in Supabase Auth (auth.users, bcrypt-hashed). This table only
-- records WHICH auth users are administrators. Nobody can add themselves:
-- there is no INSERT/UPDATE/DELETE policy, so only the service role (backend
-- script) or the SQL editor can change it.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A signed-in user may read only their own row (used by the app to check "am I admin?").
drop policy if exists "admins can read own row" on public.admin_users;
create policy "admins can read own row"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Helper for future RLS policies on other tables, e.g.
--   create policy "admins manage movies" on public.movies
--     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
