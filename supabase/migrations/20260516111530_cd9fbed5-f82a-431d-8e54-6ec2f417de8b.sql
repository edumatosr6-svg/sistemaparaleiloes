-- Adicionar política de UPDATE para contratos
CREATE POLICY "Winners can update their own contracts" 
ON public.contracts 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS ( 
    SELECT 1 FROM public.auction_winners 
    WHERE auction_winners.id = contracts.winner_id 
    AND auction_winners.user_id = auth.uid() 
  )
) 
WITH CHECK (
  EXISTS ( 
    SELECT 1 FROM public.auction_winners 
    WHERE auction_winners.id = contracts.winner_id 
    AND auction_winners.user_id = auth.uid() 
  )
);