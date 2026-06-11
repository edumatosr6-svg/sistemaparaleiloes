-- Add signature fields to auction_winners
ALTER TABLE public.auction_winners 
ADD COLUMN IF NOT EXISTS digital_signature_url TEXT,
ADD COLUMN IF NOT EXISTS digitally_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_ip TEXT;

-- Update RLS (already exists for update from previous turn, but let's ensure it covers these fields)
-- The policy "Winners can update their own payment proof" already allows update if user_id = auth.uid()
