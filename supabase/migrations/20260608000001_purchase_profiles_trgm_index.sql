-- Migration: Add Trigram Index for purchase_profiles.site_location
-- Description: Optimizes fuzzy search on site_location in purchase_profiles table
-- which is now used by the filter instead of clients.site_location

-- 1. Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add trigram index for fuzzy search on purchase_profiles.site_location
DROP INDEX IF EXISTS idx_purchase_profiles_site_location_trgm;
CREATE INDEX idx_purchase_profiles_site_location_trgm 
ON public.purchase_profiles USING gin (site_location gin_trgm_ops);

-- 3. Add indexes for other filtered columns on purchase_profiles
CREATE INDEX IF NOT EXISTS idx_purchase_profiles_quantity_type 
ON public.purchase_profiles (quantity_type);

CREATE INDEX IF NOT EXISTS idx_purchase_profiles_rate 
ON public.purchase_profiles (rate);

CREATE INDEX IF NOT EXISTS idx_purchase_profiles_quantity_value 
ON public.purchase_profiles (quantity_value);

-- 4. Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_purchase_profiles_client_id_site_location 
ON public.purchase_profiles (client_id, site_location);

-- 5. Analyze table for query planner
ANALYZE public.purchase_profiles;