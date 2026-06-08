-- Migration: Fix missing created_by column in clients table
-- Description: Ensures created_by column exists with proper foreign key and default

-- 1. Add created_by column if missing
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'clients' and column_name = 'created_by'
    ) then
        alter table public.clients 
        add column created_by uuid not null references auth.users(id) on delete restrict default auth.uid();
    end if;
end $$;

-- 2. Update RLS policies to ensure they work with the column
drop policy if exists "Users can insert own clients" on public.clients;
create policy "Users can insert own clients" on public.clients 
for insert with check (created_by = auth.uid());

drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients" on public.clients 
for select using (created_by = auth.uid());

drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients" on public.clients 
for update using (created_by = auth.uid());

drop policy if exists "Admins have full access" on public.clients;
create policy "Admins have full access" on public.clients 
for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 3. Ensure index exists for performance
create index if not exists idx_clients_created_by on public.clients(created_by);