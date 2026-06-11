-- Add deposit requirement columns to auctions table
ALTER TABLE public.auctions 
ADD COLUMN require_deposit BOOLEAN DEFAULT false,
ADD COLUMN deposit_amount NUMERIC DEFAULT 100.00;

-- Update existing auctions to not require deposit by default
UPDATE public.auctions SET require_deposit = false WHERE require_deposit IS NULL;
UPDATE public.auctions SET deposit_amount = 100.00 WHERE deposit_amount IS NULL;