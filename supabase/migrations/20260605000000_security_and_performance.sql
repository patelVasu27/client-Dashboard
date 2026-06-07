-- Migration: Security and Performance Improvements
-- Description: Implement JWT custom claims for roles, strict RLS, and performance indexes.

-- 1. Create a secure user_roles table
create table public.user_roles (
    id uuid references auth.users on delete cascade not null primary key,
    role text not null check (role in ('admin', 'user')) default 'user',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_roles enable row level security;

-- Only admins can read all roles, users can read their own
create policy "Users can read own role" on public.user_roles for select using (auth.uid() = id);

-- 2. Hook to inject role into JWT
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    claims jsonb;
    user_role public.user_roles.role%type;
begin
    -- Fetch the role for the user
    select role into user_role from public.user_roles where id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
        -- Inject the role into the app_metadata inside JWT claims
        claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    else
        claims := jsonb_set(claims, '{app_metadata, role}', '"user"');
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon;

-- 3. Create clients table and enforce Strict RLS
create table public.clients (
    id uuid default gen_random_uuid() primary key,
    buyer_name text not null,
    phone text not null,
    rate numeric not null,
    quantity_value numeric not null,
    quantity_type text not null,
    site_location text not null,
    notes text,
    created_by uuid references auth.users not null default auth.uid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clients enable row level security;

create policy "Admins have full access" on public.clients 
for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Users can read own clients" on public.clients 
for select using (auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and created_by = auth.uid());

create policy "Users can insert own clients" on public.clients 
for insert with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and created_by = auth.uid());

create policy "Users can update own clients" on public.clients 
for update using (auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and created_by = auth.uid());

-- 4. Performance Indexes matching frontend filters
create index idx_clients_created_by on public.clients(created_by);
create index idx_clients_buyer_name on public.clients(buyer_name);
create index idx_clients_site_location on public.clients(site_location);
create index idx_clients_admin_filters on public.clients(buyer_name, site_location);
