-- Add INSERT policy for admins on auction_winners
CREATE POLICY "Admins can insert winners" 
ON public.auction_winners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add UPDATE policy for admins on auction_winners
CREATE POLICY "Admins can update winners" 
ON public.auction_winners 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add DELETE policy for admins on auction_winners
CREATE POLICY "Admins can delete winners" 
ON public.auction_winners 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Grant execute on process_auction_winners_v2 to authenticated users
-- This allows admins to trigger the processing from the dashboard
GRANT EXECUTE ON FUNCTION public.process_auction_winners_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_auction_bids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO authenticated;
