-- Allow admins to insert bids for any user
CREATE POLICY "Admins can create bids for any user" 
ON public.bids 
FOR INSERT 
WITH CHECK (is_admin());
