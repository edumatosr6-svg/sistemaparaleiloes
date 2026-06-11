-- 1. Security Health Check View
CREATE OR REPLACE VIEW public.security_health_status AS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies p WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Automated Audit Logging Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
BEGIN
    v_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        v_action := 'INSERT';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (NEW).id, row_to_json(NEW)::jsonb);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (NEW).id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (OLD).id, row_to_json(OLD)::jsonb);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Apply Audit Triggers to Critical Tables
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['auctions', 'lots', 'caucao', 'profiles', 'bids'])
    LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_%I ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER tr_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();', t, t);
    END LOOP; 
END $$;

-- 4. Real-time Audit Policy
-- Ensure admins can subscribe to audit logs in real-time
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.system_logs REPLICA IDENTITY FULL;

-- 5. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage settings" ON public.system_settings TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT USING (true);
