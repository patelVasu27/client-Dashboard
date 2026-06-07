# Authentication Flow

1. User logs in via Supabase Auth.
2. Session stored securely.
3. Extract user role from JWT claims (`auth.jwt()->'app_metadata'->>'role'`).
4. Redirect:
   - Admin → Full dashboard
   - User → Restricted dashboard
5. Logout clears session.
