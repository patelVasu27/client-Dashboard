# Authentication Flow

1. User logs in via Supabase Auth.
2. Session stored securely.
3. Fetch user role from users table.
4. Redirect:
   - Admin → Full dashboard
   - User → Restricted dashboard
5. Logout clears session.
