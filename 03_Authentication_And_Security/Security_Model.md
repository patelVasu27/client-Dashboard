# Security Model

## Core Rules

- Service role key never exposed to frontend.
- RLS enabled on all tables.
- Delete restricted to admin only.
- No frontend-only security.

## Environment Variables

- SUPABASE_URL
- SUPABASE_ANON_KEY
