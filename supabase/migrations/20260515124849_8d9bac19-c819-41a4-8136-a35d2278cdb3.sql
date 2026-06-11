-- 1. Fix Function Search Paths & Execution Permissions
-- Trigger functions (no arguments)
ALTER FUNCTION public.notify_auction_winner() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.notify_auction_winner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_auction_winner() TO service_role;

ALTER FUNCTION public.check_live_lot_bidding() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.check_live_lot_bidding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_live_lot_bidding() TO authenticated, anon, service_role;

ALTER FUNCTION public.handle_new_auction_live_control() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_auction_live_control() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_auction_live_control() TO service_role;

ALTER FUNCTION public.handle_new_bid() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO authenticated, anon, service_role;

ALTER FUNCTION public.audit_log_trigger() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_log_trigger() TO authenticated, anon, service_role;

ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

ALTER FUNCTION public.sync_lot_highest_bid() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.sync_lot_highest_bid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_lot_highest_bid() TO authenticated, anon, service_role;

ALTER FUNCTION public.process_audit_log() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO service_role;

-- Regular functions with arguments
ALTER FUNCTION public.hammer_lot(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.hammer_lot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hammer_lot(uuid) TO authenticated, service_role;

ALTER FUNCTION public.reconcile_auction_bids(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) TO authenticated, service_role;

ALTER FUNCTION public.is_admin() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

ALTER FUNCTION public.process_finished_lots() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role;

ALTER FUNCTION public.refund_caucao(uuid, uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO service_role;

ALTER FUNCTION public.generate_sales_note(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_sales_note(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO service_role;

-- 2. Storage Policy Hardening
-- Remove broad public listing access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;

-- Create more specific policy for public asset viewing
CREATE POLICY "Publicly accessible assets" ON storage.objects FOR SELECT TO public
USING (bucket_id IN ('auction-assets', 'site-assets'));

-- Restrict administrative policies to the correct role
ALTER POLICY "Authenticated Delete" ON storage.objects TO authenticated;
ALTER POLICY "Authenticated Update" ON storage.objects TO authenticated;
ALTER POLICY "Authenticated Upload" ON storage.objects TO authenticated;

-- Ensure Admins have full access
DROP POLICY IF EXISTS "Admins can manage assets" ON storage.objects;
CREATE POLICY "Admins can manage assets" ON storage.objects FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
