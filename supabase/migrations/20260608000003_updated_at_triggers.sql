-- Migration: Add updated_at columns and triggers to existing tables
-- Description: Adds updated_at columns and automatic triggers to clients and purchase_profiles

-- 1. Add updated_at column to clients table
ALTER TABLE public.clients 
ADD COLUMN updated_at timestamptz default timezone('utc'::text, now()) not null;

-- 2. Ensure the updated_at trigger function exists (create if not exists)
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- 3. Add trigger to clients table
create trigger set_updated_at_clients
before update on public.clients
for each row
execute function public.set_updated_at();

-- 4. Note: purchase_profiles table already has updated_at column and trigger
-- from migration 20260608000002_purchase_profiles.sql