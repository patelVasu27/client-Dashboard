-- Migration: Create purchase_profiles table
-- Description: Main table for client purchase profiles with rate, quantity, and location data

-- 1. Create purchase_profiles table
create table public.purchase_profiles (
    id uuid default gen_random_uuid() primary key,
    client_id uuid not null references public.clients (id) on delete cascade,
    site_location text not null,
    rate numeric not null check (rate > 0),
    quantity_value numeric not null check (quantity_value > 0),
    quantity_type text not null check (quantity_type in ('RFT', 'Panel', 'RMT', 'Cement', 'Post')),
    notes text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    
    -- Ensure site_location is not empty
    constraint site_location_not_empty check (length(trim(site_location)) > 0),
    -- Ensure composite uniqueness for reasonable business logic
    constraint unique_client_site_location unique (client_id, site_location)
);

-- 2. Enable Row Level Security
alter table public.purchase_profiles enable row level security;

-- 3. Create performance indexes
create index idx_purchase_profiles_client_id on public.purchase_profiles (client_id);
create index idx_purchase_profiles_site_location on public.purchase_profiles (site_location);
create index idx_purchase_profiles_rate on public.purchase_profiles (rate);
create index idx_purchase_profiles_quantity_value on public.purchase_profiles (quantity_value);
create index idx_purchase_profiles_quantity_type on public.purchase_profiles (quantity_type);

-- 4. RLS Policies (matching clients table patterns)
-- Admins have full access
create policy "Admins have full access" on public.purchase_profiles
for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can access profiles for their own clients
create policy "Users can access own client profiles" on public.purchase_profiles
for select using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and
    client_id IN (
        select id from public.clients 
        where created_by = auth.uid()
    )
);

create policy "Users can insert own client profiles" on public.purchase_profiles
for insert with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and
    client_id IN (
        select id from public.clients 
        where created_by = auth.uid()
    )
);

create policy "Users can update own client profiles" on public.purchase_profiles
for update using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and
    client_id IN (
        select id from public.clients 
        where created_by = auth.uid()
    )
);

create policy "Users can delete own client profiles" on public.purchase_profiles
for delete using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'user' and
    client_id IN (
        select id from public.clients 
        where created_by = auth.uid()
    )
);

-- 5. Add updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.purchase_profiles
for each row
execute function public.set_updated_at();