-- Add payment_proof_url to auction_winners
ALTER TABLE public.auction_winners ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Create storage bucket for payment proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-proofs
-- Allow authenticated users to upload their own proofs
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow users to view their own proofs
CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow admins to view all proofs
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs' AND (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
));

-- RLS for auction_winners update (allow winner to update proof)
CREATE POLICY "Winners can update their own payment proof"
ON public.auction_winners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
