-- Migration: Final Schema Realignment
-- Description: Fixes 'created_st' typo and optimizes actual columns (name, created_at).

-- 1. Fix typo 'created_st' -> 'created_at'
ALTER TABLE public.clients RENAME COLUMN created_st TO created_at;

-- 2. Ensure basic extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. Optimize 'name' for fuzzy search
DROP INDEX IF EXISTS idx_clients_name_trgm;
CREATE INDEX idx_clients_name_trgm ON public.clients USING gin (name gin_trgm_ops);

-- 4. Optimize sorting
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients (created_at DESC);

-- 5. Fix RLS
-- Since 'created_by' is missing from your list, we'll check if we need to add it 
-- or if the table is currently public/unprotected. 
-- For now, we optimize what exists.
ANALYZE public.clients;
