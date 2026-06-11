-- 1. Secure the Audit Log Function
REVOKE ALL ON FUNCTION public.process_audit_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO authenticated;

-- 2. Secure the Security Health View
REVOKE ALL ON public.security_health_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.security_health_status TO authenticated;

-- Ensure only admins can actually see the data from the view via RLS is not possible on a view, 
-- but we can use a functional check in a policy-like way or just rely on the fact that only 
-- admins should be calling it from an admin-only UI.
-- A better way for views:
CREATE OR REPLACE VIEW public.security_health_status AS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies p WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
ORDER BY tablename;
