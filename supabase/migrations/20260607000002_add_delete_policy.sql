-- Migration: Add delete policy for users to delete their own clients
-- Description: Allows users to delete clients they created (created_by = auth.uid())

-- 1. Add delete policy for users
create policy "Users can delete own clients" on public.clients 
for delete using (created_by = auth.uid());

-- 2. Ensure admin policy covers delete (already covered by "for all")
-- Admin policy "Admins have full access" already includes delete via "for all"