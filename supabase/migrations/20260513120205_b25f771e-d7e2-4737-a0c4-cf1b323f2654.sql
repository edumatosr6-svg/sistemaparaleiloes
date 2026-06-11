-- Drop existing policies for live_auction_control
DROP POLICY IF EXISTS "Auction creators can manage live control" ON public.live_auction_control;
DROP POLICY IF EXISTS "Auction creators can update live control" ON public.live_auction_control;

-- Create policies that include admins
CREATE POLICY "Admins or auction creators can manage live control" 
ON public.live_auction_control 
FOR INSERT 
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = live_auction_control.auction_id 
    AND auctions.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or auction creators can update live control" 
ON public.live_auction_control 
FOR UPDATE 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = live_auction_control.auction_id 
    AND auctions.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or auction creators can delete live control" 
ON public.live_auction_control 
FOR DELETE 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.auctions 
    WHERE auctions.id = live_auction_control.auction_id 
    AND auctions.created_by = auth.uid()
  )
);