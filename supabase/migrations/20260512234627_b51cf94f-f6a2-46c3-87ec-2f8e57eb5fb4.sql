-- Use security_invoker to ensure the view respects the caller's RLS/permissions
-- This is a PostgreSQL 15+ feature commonly used in Supabase
DROP VIEW IF EXISTS public.security_health_status;
CREATE VIEW public.security_health_status WITH (security_invoker = true) AS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies p WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Grant select to authenticated users (admins will see data via logic in the app or we can add a check here)
GRANT SELECT ON public.security_health_status TO authenticated;
