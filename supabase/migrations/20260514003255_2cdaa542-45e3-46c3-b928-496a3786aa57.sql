-- Add commission and administrative fee to auctions
ALTER TABLE public.auctions 
ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT 5.00,
ADD COLUMN administrative_fee NUMERIC(15,2) DEFAULT 0.00;

-- Update auction_winners to store the breakdown
ALTER TABLE public.auction_winners
ADD COLUMN bid_amount NUMERIC(15,2),
ADD COLUMN commission_amount NUMERIC(15,2),
ADD COLUMN administrative_amount NUMERIC(15,2);

-- Update existing winners if any (set bid_amount to final_amount)
UPDATE public.auction_winners SET bid_amount = final_amount WHERE bid_amount IS NULL;
