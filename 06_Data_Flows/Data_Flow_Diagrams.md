# Data Flow Diagrams

## Login Flow

User → Supabase Auth → Session → Fetch Role → Redirect

## Fetch Clients

UI → Supabase Query → RLS → Return Filtered Data

## Delete Flow

Admin → Confirm → Supabase Delete → RLS Check → Success
