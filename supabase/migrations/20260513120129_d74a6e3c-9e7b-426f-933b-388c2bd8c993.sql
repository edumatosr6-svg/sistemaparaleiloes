-- Drop existing restrictive policies for lots
DROP POLICY IF EXISTS "Auction creators can manage lots" ON public.lots;
DROP POLICY IF EXISTS "Auction creators can update lots" ON public.lots;
DROP POLICY IF EXISTS "Auction creators can delete lots" ON public.lots;

-- Create more inclusive policies that include admins
CREATE POLICY "Admins or auction creators can insert lots" 
ON public.lots 
FOR INSERT 
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = lots.auction_id 
    AND auctions.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or auction creators can update lots" 
ON public.lots 
FOR UPDATE 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = lots.auction_id 
    AND auctions.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or auction creators can delete lots" 
ON public.lots 
FOR DELETE 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = lots.auction_id 
    AND auctions.created_by = auth.uid()
  )
);