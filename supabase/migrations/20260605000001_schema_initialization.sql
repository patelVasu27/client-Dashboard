-- 1. Enable relevant extensions
-- Note: pg_uuidv7 is recommended for time-ordered UUIDs to prevent index fragmentation,
-- but standard gen_random_uuid() is used as requested unless specific performance needs dictate otherwise.
create extension if not exists "pgcrypto";

-- 2. Create users table (Application profiles linked to auth.users)
create table public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    role text not null check (role in ('admin', 'user')),
    created_at timestamptz not null default now(),
    
    constraint email_format_check check (email ~* '^.+@.+\..+$')
);

-- 3. Create clients table
create table public.clients (
    id uuid primary key default gen_random_uuid(),
    buyer_name text not null,
    phone text not null,
    rate numeric not null check (rate > 0),
    quantity_value numeric not null check (quantity_value > 0),
    quantity_type text not null,
    site_location text not null,
    notes text,
    created_by uuid not null references public.users (id) on delete restrict,
    created_at timestamptz not null default now(),
    
    -- Ensure buyer_name is not empty
    constraint buyer_name_not_empty check (length(trim(buyer_name)) > 0),
    -- Ensure site_location is not empty
    constraint site_location_not_empty check (length(trim(site_location)) > 0)
);

-- 4. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.clients enable row level security;

-- 5. Create performance indexes
-- Note: Indexes on foreign keys are critical for performance, especially with RLS.
create index idx_clients_buyer_name on public.clients (buyer_name);
create index idx_clients_site_location on public.clients (site_location);
create index idx_clients_created_by on public.clients (created_by);

-- 6. Add partial indexes for common filters (Performance Optimization)
-- Example: Index for active clients if a 'status' field existed.
-- Given requested indexes, adding GIN for notes if full-text search was needed,
-- but sticking to requested B-tree indexes for now.

-- 7. Grant necessary permissions
revoke all on public.users from public;
revoke all on public.clients from public;

grant select on public.users to authenticated;
grant select, insert, update on public.clients to authenticated;
grant delete on public.clients to authenticated; -- Actual deletion gated by RLS role check later
