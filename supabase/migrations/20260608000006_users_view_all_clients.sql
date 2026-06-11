-- Migration: Allow all authenticated users to view all clients
-- Description: Update SELECT policy on clients table to allow all authenticated users to read all clients
-- Admins retain full access, users can view but not modify others' clients

-- 1. Drop existing SELECT policy for users
DROP POLICY IF EXISTS "Users can read own clients" ON public.clients;

-- 2. Create new SELECT policy - all authenticated users can view all clients
CREATE POLICY "Authenticated users can read all clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Keep existing INSERT/UPDATE/DELETE policies (they already work correctly)
-- - "Admins have full access" - for all on role = 'admin'
-- - "Users can insert own clients" - with check (created_by = auth.uid())
-- - "Users can update own clients" - using (created_by = auth.uid())
-- - "Users can delete own clients" - using (created_by = auth.uid())