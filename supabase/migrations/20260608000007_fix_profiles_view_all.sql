-- Migration: Fix purchase_profiles SELECT policy for view-all access
-- Description: Update SELECT policy to allow all authenticated users to read all profiles
-- This matches the clients table policy change where users can view all clients

-- 1. Drop existing SELECT policy for users
DROP POLICY IF EXISTS "Users can access own client profiles" ON public.purchase_profiles;

-- 2. Create new SELECT policy - all authenticated users can view all profiles
CREATE POLICY "Authenticated users can read all profiles" ON public.purchase_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Keep existing INSERT/UPDATE/DELETE policies (they already work correctly)
-- - "Admins have full access" - for all on role = 'admin'
-- - "Users can insert own client profiles" - with check (created_by = auth.uid())
-- - "Users can update own client profiles" - using (created_by = auth.uid())
-- - "Users can delete own client profiles" - using (created_by = auth.uid())