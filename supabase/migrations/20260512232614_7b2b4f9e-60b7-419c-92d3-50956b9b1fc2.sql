-- Revoke for functions with NO arguments
REVOKE ALL ON FUNCTION public.handle_new_bid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_finished_lots() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_process_finished_lots() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Revoke for functions WITH arguments
REVOKE ALL ON FUNCTION public.refund_caucao(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_sales_note(uuid) FROM PUBLIC, anon, authenticated;

-- Grant specifically
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_process_finished_lots() TO authenticated;

GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Set search_path
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
ALTER FUNCTION public.process_finished_lots() SET search_path = public;
ALTER FUNCTION public.refund_caucao(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.generate_sales_note(uuid) SET search_path = public;
ALTER FUNCTION public.trigger_process_finished_lots() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
