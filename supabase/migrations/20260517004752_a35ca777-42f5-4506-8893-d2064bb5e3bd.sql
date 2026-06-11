-- Revoke execute from public/authenticated on trigger functions
REVOKE EXECUTE ON FUNCTION public.notify_chat_message() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_private() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_payment_confirmed_notify() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_lot_highest_bid() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_auction_winner_created() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.execute_auto_bids() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_outbid() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_auction_winner() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_live_lot_bidding() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auction_live_control() FROM PUBLIC, authenticated;

-- Ensure these are only executable by service_role (and owner)
GRANT EXECUTE ON FUNCTION public.notify_chat_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_private() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO service_role;
GRANT EXECUTE ON FUNCTION public.on_payment_confirmed_notify() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_lot_highest_bid() TO service_role;
GRANT EXECUTE ON FUNCTION public.on_auction_winner_created() TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_auto_bids() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_outbid() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_auction_winner() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_live_lot_bidding() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_auction_live_control() TO service_role;
