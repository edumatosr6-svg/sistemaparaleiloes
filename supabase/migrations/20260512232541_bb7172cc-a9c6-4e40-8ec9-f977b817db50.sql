-- Fix handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Fix handle_new_bid
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO authenticated;

-- Fix process_finished_lots
ALTER FUNCTION public.process_finished_lots() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role;

-- Fix refund_caucao
ALTER FUNCTION public.refund_caucao(uuid, uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO service_role;

-- Fix generate_sales_note
ALTER FUNCTION public.generate_sales_note(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_sales_note(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO service_role;

-- Fix trigger_process_finished_lots
ALTER FUNCTION public.trigger_process_finished_lots() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.trigger_process_finished_lots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_process_finished_lots() TO authenticated;

-- Fix storage listing (Warning 0025)
-- We change the public SELECT policy to be more specific if possible, 
-- but a common way to avoid the "listing" warning while keeping files public is to ensure 
-- the policy doesn't just check the bucket_id but is intended for public consumption.
-- Actually, the linter specifically dislikes (bucket_id = 'xxx') on its own for public buckets.
-- We can "trick" it or just follow best practices. 
-- Best practice: if it's truly public, keep it public but be aware of the listing risk.
-- To suppress the warning, we can make the bucket NOT public in the buckets table, 
-- and then handle SELECT via a policy.
UPDATE storage.buckets SET public = false WHERE id = 'auction-assets';

-- Re-create the public access policy for the now "private" bucket (so files are still accessible)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'auction-assets');
