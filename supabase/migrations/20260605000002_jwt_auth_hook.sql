-- Migration: Add custom JWT hook for roles
-- Description: Injects user role into JWT app_metadata

-- Create the custom access token hook function
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    claims jsonb;
    user_role text;
begin
    -- Fetch the role for the user from public.users
    select role into user_role from public.users where id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
        -- Inject the role into the app_metadata inside JWT claims
        claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    else
        claims := jsonb_set(claims, '{app_metadata, role}', '"user"'::jsonb);
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
end;
$$;

-- Grant execution to supabase_auth_admin
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- NOTE: To enable this hook, you must configure it in your Supabase Auth settings.
-- This can be done in the Supabase Dashboard or via config.toml if running locally.
