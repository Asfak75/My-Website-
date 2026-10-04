-- Personal Service Website: Supabase database setup
-- Run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  status boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '01728405841'
    check (char_length(regexp_replace(whatsapp_number, '[^0-9]', '', 'g')) between 8 and 15),
  updated_at timestamptz not null default now()
);

-- Only these UUIDs are administrators.
-- After creating your first Auth user, insert that user's UUID here.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists services_public_order_idx
  on public.services (status, display_order, created_at);

create index if not exists admin_users_user_id_idx
  on public.admin_users (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- Security-definer helper prevents RLS recursion and does not expose admin data.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.services enable row level security;
alter table public.settings enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
to anon, authenticated
using (status = true or public.is_admin());

drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
on public.services for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
on public.services for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
on public.services for delete
to authenticated
using (public.is_admin());

drop policy if exists "Public can read WhatsApp setting" on public.settings;
create policy "Public can read WhatsApp setting"
on public.settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update settings" on public.settings;
create policy "Admins can update settings"
on public.settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- No direct client access to admin_users.
revoke all on table public.admin_users from anon, authenticated;

-- Initial data.
insert into public.settings (id, whatsapp_number)
values (1, '01728405841')
on conflict (id) do update
set whatsapp_number = excluded.whatsapp_number;

insert into public.services (name, status, display_order)
select *
from (values
  ('Server Copy', true, 1),
  ('Signature Copy', true, 2),
  ('NID PDF', true, 3),
  ('Card Making', true, 4)
) as seed(name, status, display_order)
where not exists (select 1 from public.services);

-- IMPORTANT:
-- After you create the first admin user in Authentication > Users,
-- run the following with that user's UUID:
--
-- insert into public.admin_users (user_id)
-- values ('PASTE_AUTH_USER_UUID_HERE')
-- on conflict do nothing;
