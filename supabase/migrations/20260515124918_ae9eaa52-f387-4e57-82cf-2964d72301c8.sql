-- 1. Secure Profiles Table
-- Restrict SELECT policy to own profile or admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Create a safe public view for UI components
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url, role, created_at
FROM public.profiles;

-- Grant select on the view to everyone
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

-- 2. Explicitly Revoke Execution for Security Definer Functions
-- These were previously granted to anon/authenticated and must be removed to fix linter warnings.

-- Functions that should NOT be callable by anonymous users
REVOKE EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.hammer_lot(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hammer_lot(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.generate_sales_note(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO service_role;

-- Trigger functions: these often need EXECUTE for the performing user, 
-- but we should ensure they are not callable via RPC by anon if they are sensitive.
-- Most of these are fine for authenticated users if they fire triggers, 
-- but let's revoke from anon where it makes sense.

REVOKE EXECUTE ON FUNCTION public.notify_auction_winner() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_auction_live_control() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM anon;
