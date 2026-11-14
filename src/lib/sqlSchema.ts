export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- OPTICPORTAL DATABASE SCHEMA FOR SUPABASE (MULTI-AGENT)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create public.agents table
create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  phone_number text,
  auth_user_id uuid references auth.users(id) on delete cascade,
  avatar_url text,
  territory text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create public.shops table
create table if not exists public.shops (
  id uuid primary key default uuid_generate_v4(),
  shop_name text not null,
  location text not null,
  owner_email text not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  agent_id uuid not null references public.agents(id) on delete cascade,
  is_active boolean not null default true,
  status text not null default 'active',
  subscription_status text not null default 'active',
  hold_reason text,
  hold_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure status & maintenance columns exist on public.shops for existing schemas
alter table if exists public.shops add column if not exists status text default 'active';
alter table if exists public.shops add column if not exists subscription_status text default 'active';
alter table if exists public.shops add column if not exists hold_reason text;
alter table if exists public.shops add column if not exists hold_date timestamp with time zone;
alter table if exists public.shops add column if not exists last_activity_at timestamp with time zone;

-- 4. Create public.shop_configs table
create table if not exists public.shop_configs (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  subdomain_slug text unique not null,
  logo_url text,
  primary_color text not null default '#0284c7',
  secondary_color text not null default '#0f172a',
  background_image_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create public.shop_subscriptions_ledger table
create table if not exists public.shop_subscriptions_ledger (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  amount_paid numeric(10, 2) not null,
  agent_commission numeric(10, 2) not null, -- 50% split to sales agent
  platform_share numeric(10, 2) not null,   -- 50% split to OpticPortal platform
  billing_period_start date not null,
  billing_period_end date not null,
  payment_month text,                       -- e.g. '2026-03' (month for which subscription was paid)
  collection_method text default 'cash',    -- cash, cliq, bank_transfer, pos
  collected_by_agent boolean default true,  -- agent physically/digitally collected and remitted to app
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Indexes for performance
create index if not exists idx_agents_auth_user on public.agents(auth_user_id);
create index if not exists idx_shops_agent on public.shops(agent_id);
create index if not exists idx_ledger_agent on public.shop_subscriptions_ledger(agent_id);
create index if not exists idx_ledger_shop on public.shop_subscriptions_ledger(shop_id);
create index if not exists idx_ledger_month on public.shop_subscriptions_ledger(payment_month);

-- 7. Enable Row Level Security (RLS)
alter table public.agents enable row level security;
alter table public.shops enable row level security;
alter table public.shop_configs enable row level security;
alter table public.shop_subscriptions_ledger enable row level security;

-- Explicit policies for agents table
drop policy if exists "Allow agents to view their own profile" on public.agents;
drop policy if exists "Allow all users to select agents" on public.agents;
drop policy if exists "Allow all users to insert agents" on public.agents;
drop policy if exists "Allow all users to update agents" on public.agents;
drop policy if exists "Allow all users to manage agents" on public.agents;

create policy "Allow all users to select agents"
  on public.agents for select
  to public, anon, authenticated
  using (true);

create policy "Allow all users to insert agents"
  on public.agents for insert
  to public, anon, authenticated
  with check (true);

create policy "Allow all users to update agents"
  on public.agents for update
  to public, anon, authenticated
  using (true)
  with check (true);

-- Explicit policies for shops table ensuring full SELECT, INSERT, UPDATE, DELETE for anon and authenticated users
drop policy if exists "Allow agents to view and manage their assigned shops" on public.shops;
drop policy if exists "Allow all users to select shops" on public.shops;
drop policy if exists "Allow all users to insert shops" on public.shops;
drop policy if exists "Allow all users to update shops" on public.shops;
drop policy if exists "Allow all users to delete shops" on public.shops;
drop policy if exists "Allow all users to manage shops" on public.shops;

create policy "Allow all users to select shops"
  on public.shops for select
  to public, anon, authenticated
  using (true);

create policy "Allow all users to insert shops"
  on public.shops for insert
  to public, anon, authenticated
  with check (true);

create policy "Allow all users to update shops"
  on public.shops for update
  to public, anon, authenticated
  using (true)
  with check (true);

create policy "Allow all users to delete shops"
  on public.shops for delete
  to public, anon, authenticated
  using (true);

-- Explicit policies for shop_configs ensuring UPDATE and INSERT for authenticated users and anon clients
drop policy if exists "Allow agents to manage shop configurations" on public.shop_configs;
drop policy if exists "Allow all users to select shop_configs" on public.shop_configs;
drop policy if exists "Allow all users to insert shop_configs" on public.shop_configs;
drop policy if exists "Allow all users to update shop_configs" on public.shop_configs;

create policy "Allow all users to select shop_configs"
  on public.shop_configs for select
  to public, anon, authenticated
  using (true);

create policy "Allow all users to insert shop_configs"
  on public.shop_configs for insert
  to public, anon, authenticated
  with check (true);

create policy "Allow all users to update shop_configs"
  on public.shop_configs for update
  to public, anon, authenticated
  using (true)
  with check (true);

create policy "Allow all users to delete shop_configs"
  on public.shop_configs for delete
  to public, anon, authenticated
  using (true);

-- Grant table-level permissions to anon, authenticated, and service_role
grant all on public.agents to anon, authenticated, service_role;
grant all on public.shops to anon, authenticated, service_role;
grant all on public.shop_configs to anon, authenticated, service_role;
grant all on public.shop_subscriptions_ledger to anon, authenticated, service_role;

create policy "Allow agents to view and insert ledger billing entries" 
  on public.shop_subscriptions_ledger for all 
  using (true) with check (true);

-- Seed default demo agents so onboarding and agent scoping work out-of-the-box
insert into public.agents (id, full_name, email, phone_number)
values
  ('a0123456-789a-bcde-f012-3456789abcde', 'Tariq Al-Mansoor', 'tariq.agent@opticportal.io', '+962 7 9855 2410'),
  ('a0222222-789a-bcde-f012-3456789abcde', 'Layla Nader', 'layla.optics@opticportal.io', '+962 7 8765 4321'),
  ('a0333333-789a-bcde-f012-3456789abcde', 'Zaid Haddad', 'zaid.vision@opticportal.io', '+962 7 7654 3210')
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number;

-- 8. Create public.profiles table (synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('agent', 'shop_owner', 'optometrist', 'optician', 'marketer', 'staff')),
  shop_id uuid references public.shops(id) on delete cascade,
  created_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create public.shop_staff_credentials table (for staff roster audit)
create table if not exists public.shop_staff_credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  email text not null,
  role text not null check (role in ('shop_owner', 'optometrist', 'optician', 'marketer')),
  full_name text not null,
  created_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely remove restrictive FK constraints on created_by if tables were already created
alter table if exists public.shop_staff_credentials drop constraint if exists shop_staff_credentials_created_by_fkey;
alter table if exists public.profiles drop constraint if exists profiles_created_by_fkey;

alter table public.profiles enable row level security;
alter table public.shop_staff_credentials enable row level security;

-- Policies for public.profiles
drop policy if exists "Allow all users to select profiles" on public.profiles;
drop policy if exists "Allow all users to manage profiles" on public.profiles;
drop policy if exists "Allow all users to update profiles" on public.profiles;

create policy "Allow all users to select profiles" on public.profiles for select to public, anon, authenticated using (true);
create policy "Allow all users to manage profiles" on public.profiles for all to public, anon, authenticated using (true) with check (true);

-- Explicit policies for public.shop_staff_credentials ensuring insert, select, update, delete for anon and authenticated
drop policy if exists "Allow all users to select shop_staff_credentials" on public.shop_staff_credentials;
drop policy if exists "Allow all users to manage shop_staff_credentials" on public.shop_staff_credentials;
drop policy if exists "Allow all users to insert shop_staff_credentials" on public.shop_staff_credentials;
drop policy if exists "Allow all users to update shop_staff_credentials" on public.shop_staff_credentials;
drop policy if exists "Allow all users to delete shop_staff_credentials" on public.shop_staff_credentials;

create policy "Allow all users to select shop_staff_credentials" on public.shop_staff_credentials for select to public, anon, authenticated using (true);
create policy "Allow all users to insert shop_staff_credentials" on public.shop_staff_credentials for insert to public, anon, authenticated with check (true);
create policy "Allow all users to update shop_staff_credentials" on public.shop_staff_credentials for update to public, anon, authenticated using (true) with check (true);
create policy "Allow all users to delete shop_staff_credentials" on public.shop_staff_credentials for delete to public, anon, authenticated using (true);

grant all on public.profiles to anon, authenticated, service_role;
grant all on public.shop_staff_credentials to anon, authenticated, service_role;

-- 10. Trigger function on auth.users AFTER INSERT
create or replace function public.handle_new_staff_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _shop_id uuid;
  _role text;
  _created_by uuid;
  _full_name text;
begin
  begin
    _shop_id := (new.raw_user_meta_data->>'shop_id')::uuid;
  exception when others then
    _shop_id := null;
  end;

  _role := new.raw_user_meta_data->>'role';

  begin
    _created_by := (new.raw_user_meta_data->>'created_by')::uuid;
  exception when others then
    _created_by := null;
  end;

  _full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  if _role = 'agent' or _role is null then
    -- Default or agent signup: ensure profile has role = 'agent'
    insert into public.profiles (id, full_name, role, created_by)
    values (new.id, _full_name, 'agent', _created_by)
    on conflict (id) do update set
      full_name = excluded.full_name,
      role = 'agent';

    insert into public.agents (id, full_name, email, auth_user_id)
    values (new.id, _full_name, new.email, new.id)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      auth_user_id = excluded.auth_user_id;
  elsif _shop_id is not null and _role is not null then
    insert into public.profiles (id, full_name, role, shop_id, created_by)
    values (new.id, _full_name, _role, _shop_id, _created_by)
    on conflict (id) do update set
      full_name = excluded.full_name,
      role = excluded.role,
      shop_id = excluded.shop_id;

    insert into public.shop_staff_credentials (user_id, shop_id, email, role, full_name, created_by)
    values (new.id, _shop_id, new.email, _role, _full_name, _created_by);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_staff on auth.users;
create trigger on_auth_user_created_staff
  after insert on auth.users
  for each row execute procedure public.handle_new_staff_user();

-- 11. Shop Usage Telemetry Tables (Last 30 Days & Activity Tracking)
create table if not exists public.try_on_sessions (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_ref text,
  frame_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  session_id uuid,
  frame_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_try_on_sessions_shop_created on public.try_on_sessions(shop_id, created_at desc);
create index if not exists idx_recommendations_shop_created on public.recommendations(shop_id, created_at desc);

alter table public.try_on_sessions enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists "Allow all users to select try_on_sessions" on public.try_on_sessions;
drop policy if exists "Allow all users to insert try_on_sessions" on public.try_on_sessions;
create policy "Allow all users to select try_on_sessions" on public.try_on_sessions for select to public, anon, authenticated using (true);
create policy "Allow all users to insert try_on_sessions" on public.try_on_sessions for insert to public, anon, authenticated with check (true);

drop policy if exists "Allow all users to select recommendations" on public.recommendations;
drop policy if exists "Allow all users to insert recommendations" on public.recommendations;
create policy "Allow all users to select recommendations" on public.recommendations for select to public, anon, authenticated using (true);
create policy "Allow all users to insert recommendations" on public.recommendations for insert to public, anon, authenticated with check (true);

grant all on public.try_on_sessions to anon, authenticated, service_role;
grant all on public.recommendations to anon, authenticated, service_role;

-- 12. Create public.shop_notes table (Agent notes & follow-ups per shop)
create table if not exists public.shop_notes (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  note text not null,
  follow_up_date date,
  done boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_shop_notes_shop on public.shop_notes(shop_id);
create index if not exists idx_shop_notes_agent_due on public.shop_notes(agent_id, follow_up_date, done);

alter table public.shop_notes enable row level security;

drop policy if exists "Allow all users to select shop_notes" on public.shop_notes;
drop policy if exists "Allow all users to insert shop_notes" on public.shop_notes;
drop policy if exists "Allow all users to update shop_notes" on public.shop_notes;
drop policy if exists "Allow all users to delete shop_notes" on public.shop_notes;

create policy "Allow all users to select shop_notes"
  on public.shop_notes for select
  to public, anon, authenticated
  using (true);

create policy "Allow all users to insert shop_notes"
  on public.shop_notes for insert
  to public, anon, authenticated
  with check (true);

create policy "Allow all users to update shop_notes"
  on public.shop_notes for update
  to public, anon, authenticated
  using (true)
  with check (true);

create policy "Allow all users to delete shop_notes"
  on public.shop_notes for delete
  to public, anon, authenticated
  using (true);

grant all on public.shop_notes to anon, authenticated, service_role;
`;
