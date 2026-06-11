-- 1. Make payment-proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- 2. Remove existing restrictive/incorrect policies for payment-proofs
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;

-- 3. Create new secure policies for payment-proofs
-- Policy for users to view their own proofs/documents
CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND (
    EXISTS (
      SELECT 1 FROM public.auction_winners
      WHERE auction_winners.user_id = auth.uid()
      AND auction_winners.id::text = (storage.foldername(name))[1]
    )
    OR is_admin()
  )
);

-- Policy for users to upload their own proofs
-- We allow upload if the first part of the name matches a winner record they own
CREATE POLICY "Users can upload their own payment proofs" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.auction_winners
    WHERE auction_winners.user_id = auth.uid()
    AND auction_winners.id::text = (storage.foldername(name))[1]
  )
);

-- Policy for admins to have full access
CREATE POLICY "Admins can manage payment proofs" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND is_admin()
)
WITH CHECK (
  bucket_id = 'payment-proofs' AND is_admin()
);
