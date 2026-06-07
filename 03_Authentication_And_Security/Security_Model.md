# Security Model

## Core Rules

- Service role key never exposed to frontend.
- RLS enabled on all tables using JWT role claims.
- Delete restricted to admin only at DB level.
- No frontend-only security.
- Strict CSP headers enforced via `vercel.json`.
- Supabase network rate limits configured to prevent API abuse.

## Environment Variables

- SUPABASE_URL
- SUPABASE_ANON_KEY
