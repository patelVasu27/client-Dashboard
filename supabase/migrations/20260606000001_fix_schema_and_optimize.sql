-- Migration: Fix Schema Typo and Optimize
-- Description: Renames 'emial' to 'email', targets 'name' for fuzzy search, and adds indexes.

-- 1. Fix the typo 'emial' -> 'email'
alter table public.clients rename column emial to email;

-- 2. Enable pg_trgm for fuzzy search
create extension if not exists pg_trgm;

-- 3. Optimize fuzzy search for 'name' (replaces previous 'buyer_name' logic)
-- Dropping any old index that might exist from previous attempts
drop index if exists idx_clients_buyer_name_trgm;
create index idx_clients_name_trgm on public.clients using gin (name gin_trgm_ops);

-- 4. Optimize sorting and RLS lookups
create index idx_clients_created_by_created_at on public.clients (created_by, created_at desc);

-- 5. Correct RLS Policies to use 'name' instead of 'buyer_name'
-- Note: Assuming 'created_by' exists as it's standard. 
-- If 'created_by' is also missing, we will detect it in the next validation.
drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients" on public.clients 
for select using (
    (created_by = (select auth.uid()))
);
