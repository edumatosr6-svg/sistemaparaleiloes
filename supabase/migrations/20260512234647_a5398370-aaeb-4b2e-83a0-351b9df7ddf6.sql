-- 1. Create Internal Schema
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Move Functions to Internal Schema
-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET SCHEMA internal;
-- handle_new_bid
ALTER FUNCTION public.handle_new_bid() SET SCHEMA internal;
-- process_finished_lots
ALTER FUNCTION public.process_finished_lots() SET SCHEMA internal;
-- refund_caucao
ALTER FUNCTION public.refund_caucao(uuid, uuid) SET SCHEMA internal;
-- generate_sales_note
ALTER FUNCTION public.generate_sales_note(uuid) SET SCHEMA internal;
-- trigger_process_finished_lots
ALTER FUNCTION public.trigger_process_finished_lots() SET SCHEMA internal;
-- process_audit_log
ALTER FUNCTION public.process_audit_log() SET SCHEMA internal;

-- 3. Update Triggers to use the new schema
-- handle_new_user (auth.users trigger)
-- (We need to update the trigger on auth.users if possible, but we don't have direct access to drop/recreate on auth schema here usually, 
-- but Supabase usually handles the function name change if it was just renamed, however, moving schema might break it).
-- Actually, let's keep handle_new_user in public but ensure it's restricted.

-- For others:
-- bids
DROP TRIGGER IF EXISTS tr_validate_bid ON public.bids;
CREATE TRIGGER tr_validate_bid BEFORE INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION internal.handle_new_bid();

-- process_finished_on_bid
DROP TRIGGER IF EXISTS tr_process_finished_on_bid ON public.bids;
CREATE TRIGGER tr_process_finished_on_bid AFTER INSERT ON public.bids
FOR EACH STATEMENT EXECUTE FUNCTION internal.trigger_process_finished_lots();

-- audit triggers
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['auctions', 'lots', 'caucao', 'profiles', 'bids'])
    LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_%I ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER tr_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION internal.process_audit_log();', t, t);
    END LOOP; 
END $$;
