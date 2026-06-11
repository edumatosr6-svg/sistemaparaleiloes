CREATE POLICY "Admins can view all winners" 
ON public.auction_winners 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR auth.uid() IS NULL -- Allow view from service role/system contexts
);