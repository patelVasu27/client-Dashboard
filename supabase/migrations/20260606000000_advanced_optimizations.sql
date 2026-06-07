-- Migration: Advanced Performance Optimizations
-- Description: Trigram search, optimized sorting indexes, and RLS plan caching.

-- 1. Enable pg_trgm for fuzzy search performance
create extension if not exists pg_trgm;

-- 2. Optimize fuzzy search for buyer_name
-- Standard B-Tree doesn't support middle-anchored LIKE, GIN with trgm does.
drop index if exists idx_clients_buyer_name;
create index idx_clients_buyer_name_trgm on public.clients using gin (buyer_name gin_trgm_ops);

-- 3. Optimize sorting and RLS lookups
-- A composite index on (created_by, created_at) allows index-only sorting for RLS-filtered queries.
create index idx_clients_created_by_created_at on public.clients (created_by, created_at desc);

-- 4. Add indexes for common range and equality filters
create index idx_clients_rate on public.clients (rate);
create index idx_clients_quantity_type on public.clients (quantity_type);

-- 5. Optimize RLS Policies for plan caching
-- Wrapping auth functions in a subquery (select auth.uid()) allows Postgres to cache the value.
drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients" on public.clients 
for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'user') 
    and (created_by = (select auth.uid()))
);

-- Similarly for update/delete if needed, but select is the high-frequency query.
drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients" on public.clients 
for update using (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'user') 
    and (created_by = (select auth.uid()))
);
