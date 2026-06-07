-- Migration: Consolidate Role System and Fix Schema Inconsistencies
-- Description: Unifies roles in user_roles, fixes JWT hook, and ensures client column names match frontend.

-- 1. Ensure user_roles is the source of truth
do $$
begin
    if not exists (select 1 from pg_tables where tablename = 'user_roles' and schemaname = 'public') then
        create table public.user_roles (
            id uuid references auth.users on delete cascade not null primary key,
            role text not null check (role in ('admin', 'user')) default 'user',
            created_at timestamptz default now() not null
        );
        alter table public.user_roles enable row level security;
        create policy "Users can read own role" on public.user_roles for select using (auth.uid() = id);
    end if;
end $$;

-- 2. Correct the JWT hook to use user_roles
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    claims jsonb;
    user_role text;
begin
    select role into user_role from public.user_roles where id = (event->>'user_id')::uuid;
    claims := event->'claims';
    if user_role is not null then
        claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    else
        claims := jsonb_set(claims, '{app_metadata, role}', '"user"'::jsonb);
    end if;
    event := jsonb_set(event, '{claims}', claims);
    return event;
end;
$$;

-- 3. Final alignment of clients table columns
-- Frontend currently expects: id, buyer_name, email, created_at, notes, rate, quantity_value, quantity_type, site_location, created_by
do $$
begin
    -- Standardize name field to buyer_name (as used in clientService.js)
    if exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'name') then
        alter table public.clients rename column "name" to buyer_name;
    end if;

    -- Ensure created_at is consistent
    if exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'created_st') then
        alter table public.clients rename column created_st to created_at;
    end if;
end $$;

-- 4. Re-verify RLS policies for unified buyer_name
drop policy if exists "Admins have full access" on public.clients;
create policy "Admins have full access" on public.clients 
for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients" on public.clients 
for select using (created_by = auth.uid());

drop policy if exists "Users can insert own clients" on public.clients;
create policy "Users can insert own clients" on public.clients 
for insert with check (created_by = auth.uid());

drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients" on public.clients 
for update using (created_by = auth.uid());
