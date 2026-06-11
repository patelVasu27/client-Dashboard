-- Migration: Create RPC function for atomic client and profile creation
-- Description: Creates a database function that wraps client and profile creation in a single transaction

-- 1. Create RPC function for atomic client creation
create or replace function public.create_client_with_profile(
    p_buyer_name text,
    p_phone text,
    p_site_location text,
    p_rate numeric,
    p_quantity_value numeric,
    p_quantity_type text,
    p_notes text,
    p_created_by uuid
)
returns json
language plpgsql
security definer
as $$
declare
    v_client_record public.clients%rowtype;
    v_profile_record public.purchase_profiles%rowtype;
    v_result json;
begin
    -- Start transaction
    begin
        -- Insert client
        insert into public.clients (
            buyer_name, phone, site_location, rate, quantity_value, 
            quantity_type, notes, created_by
        ) values (
            p_buyer_name, p_phone, p_site_location, p_rate, p_quantity_value,
            p_quantity_type, p_notes, p_created_by
        )
        returning * into v_client_record;
        
        -- Insert purchase profile
        insert into public.purchase_profiles (
            client_id, site_location, rate, quantity_value, 
            quantity_type, notes
        ) values (
            v_client_record.id, p_site_location, p_rate, p_quantity_value,
            p_quantity_type, p_notes
        )
        returning * into v_profile_record;
        
        -- Return combined result
        v_result := json_build_object(
            'client', to_jsonb(v_client_record),
            'profile', to_jsonb(v_profile_record)
        );
        
        return v_result;
    exception
        when others then
            -- Rollback transaction and re-raise error
            raise;
    end;
end;
$$;

-- 2. Grant execute permission to authenticated users
grant execute on function public.create_client_with_profile to authenticated;