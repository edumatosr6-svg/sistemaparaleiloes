-- Revoke execute from public/authenticated on system/admin functions
REVOKE EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_sales_note(uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_auction_winners_v2(uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) FROM PUBLIC, authenticated;

-- Ensure these are only executable by service_role (and owner)
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_auction_winners_v2(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) TO service_role;
