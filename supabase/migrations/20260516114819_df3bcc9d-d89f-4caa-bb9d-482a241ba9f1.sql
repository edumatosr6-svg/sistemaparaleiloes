-- Fix Storage Policies for payment-proofs
-- Allow users to UPDATE their own files (needed for upsert)
DROP POLICY IF EXISTS "Users can update their own payment proofs" ON storage.objects;
CREATE POLICY "Users can update their own payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'payment-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow users to DELETE their own files (sometimes needed by storage clients)
DROP POLICY IF EXISTS "Users can delete their own payment proofs" ON storage.objects;
CREATE POLICY "Users can delete their own payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Refine INSERT policy for payment-proofs to be safer
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Ensure the bucket is public so getPublicUrl works (as used in the code)
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';

-- Fix auction_winners and generated_pdfs once more to be sure
ALTER TABLE public.auction_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;

-- If a user is a winner, they should be able to update their winner record
DROP POLICY IF EXISTS "Winners can update their own records" ON public.auction_winners;
CREATE POLICY "Winners can update their own records" 
ON public.auction_winners 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for contracts table
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

-- Allow users to insert contracts if they are the winners
DROP POLICY IF EXISTS "Winners can insert their own contracts" ON public.contracts;
CREATE POLICY "Winners can insert their own contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.auction_winners 
    WHERE public.auction_winners.id = public.contracts.winner_id 
    AND public.auction_winners.user_id = auth.uid()
));
