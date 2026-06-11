-- Migration: Add business rule check constraints
-- Description: Add business rule constraints for data validation

-- 1. Add business rule constraints to clients table
ALTER TABLE public.clients
ADD CONSTRAINT clients_buyer_name_not_empty
    CHECK (length(trim(buyer_name)) > 0),
ADD CONSTRAINT clients_phone_not_empty
    CHECK (length(trim(phone)) > 0),
ADD CONSTRAINT clients_phone_format
    CHECK (phone ~ '^\\+?\\d{10,15}$'),
ADD CONSTRAINT clients_site_location_not_empty
    CHECK (length(trim(site_location)) > 0);

-- 2. Add business rule constraints to purchase_profiles table
ALTER TABLE public.purchase_profiles
ADD CONSTRAINT purchase_profiles_rate_positive
    CHECK (rate > 0),
ADD CONSTRAINT purchase_profiles_quantity_value_positive
    CHECK (quantity_value > 0),
ADD CONSTRAINT purchase_profiles_site_location_not_empty
    CHECK (length(trim(site_location)) > 0);

-- 3. Create custom validation function for complex business rules
create or replace function public.validate_client_business_rules()
returns trigger as $$
begin
    -- Enforce business rule: Rate must be reasonable (0.01 to 10000)
    if new.rate < 0.01 or new.rate > 10000 then
        raise exception 'Rate must be between 0.01 and 10000';
    end if;
    
    -- Enforce business rule: Quantity value must be reasonable (0.01 to 1000000)
    if new.quantity_value < 0.01 or new.quantity_value > 1000000 then
        raise exception 'Quantity value must be between 0.01 and 1000000';
    end if;
    
    -- Enforce business rule: Phone must contain only digits and common separators
    if new.phone !~ '^\\+?\\d{0,3}\\s?\\d{10,15}$' then
        raise exception 'Phone format is invalid';
    end if;
    
    return new;
end;
$$ language plpgsql;

-- 4. Create trigger for business rule validation
create trigger validate_client_business_rules
before insert or update on public.clients
for each row
execute function public.validate_client_business_rules();

-- 5. Create validation function for purchase_profiles
create or replace function public.validate_profile_business_rules()
returns trigger as $$
begin
    -- Enforce business rule: Rate consistency between client and profile (if both exist)
    -- Note: This is a basic check - more complex business logic can be added
    if new.rate < 0.01 or new.rate > 10000 then
        raise exception 'Rate must be between 0.01 and 10000';
    end if;
    
    -- Enforce business rule: Quantity value consistency
    if new.quantity_value < 0.01 or new.quantity_value > 1000000 then
        raise exception 'Quantity value must be between 0.01 and 1000000';
    end if;
    
    return new;
end;
$$ language plpgsql;

-- 6. Create trigger for profile business rule validation
create trigger validate_profile_business_rules
before insert or update on public.purchase_profiles
for each row
execute function public.validate_profile_business_rules();