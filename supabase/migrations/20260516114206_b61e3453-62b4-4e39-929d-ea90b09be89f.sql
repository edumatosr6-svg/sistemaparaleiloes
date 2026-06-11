-- Reforce RLS for auction_winners
DROP POLICY IF EXISTS "Winners can update their own payment proof" ON public.auction_winners;
CREATE POLICY "Winners can update their own records" 
ON public.auction_winners 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reforce RLS for contracts
DROP POLICY IF EXISTS "Winners can update their own contracts" ON public.contracts;
CREATE POLICY "Winners can update their own contracts" 
ON public.contracts 
FOR UPDATE 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.auction_winners 
    WHERE public.auction_winners.id = public.contracts.winner_id 
    AND public.auction_winners.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.auction_winners 
    WHERE public.auction_winners.id = public.contracts.winner_id 
    AND public.auction_winners.user_id = auth.uid()
));

-- Ensure generated_pdfs is solid
DROP POLICY IF EXISTS "Users can insert their own generated PDFs" ON public.generated_pdfs;
CREATE POLICY "Users can insert their own generated PDFs" 
ON public.generated_pdfs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own generated PDFs" ON public.generated_pdfs;
CREATE POLICY "Users can view their own generated PDFs" 
ON public.generated_pdfs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
