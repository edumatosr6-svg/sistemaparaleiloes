-- 1. Fix RLS policy on auction_winners that allowed anonymous access
DROP POLICY IF EXISTS "Admins can view all winners" ON public.auction_winners;
CREATE POLICY "Admins can view all winners" 
ON public.auction_winners
FOR SELECT 
USING (
  (EXISTS ( 
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::public.user_role
  ))
);

-- 2. Set search_path for all public functions to prevent search path hijacking
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proconfig IS NULL
    ) LOOP
        EXECUTE 'ALTER FUNCTION ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') SET search_path = public';
    END LOOP;
END $$;

-- 3. Secure SECURITY DEFINER functions
-- First, revoke execute from PUBLIC (which includes anon) for all functions in public schema
-- This is a broad hardening step recommended by Supabase security docs
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Then grant execute back to roles that need it
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Special case: is_admin might be used in policies. While most of our public policies
-- use 'true', we should ensure authenticated users can always check if they are admins.
-- Actually, the above GRANTs cover authenticated.
