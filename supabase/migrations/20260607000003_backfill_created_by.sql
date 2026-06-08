-- Migration: Backfill created_by for existing clients
-- Description: Sets created_by for existing NULL rows to the current authenticated user

-- 1. Backfill NULL created_by with current user (for single-user testing)
UPDATE public.clients 
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- 2. Verify the update
SELECT id, buyer_name, created_by FROM public.clients;