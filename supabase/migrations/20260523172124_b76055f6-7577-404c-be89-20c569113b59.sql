-- Update favorites to cascade on auction_id
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_auction_id_fkey,
ADD CONSTRAINT favorites_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

-- Update favorites to cascade on lot_id
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_lot_id_fkey,
ADD CONSTRAINT favorites_lot_id_fkey 
FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- Update auto_bids to cascade on lot_id
ALTER TABLE public.auto_bids 
DROP CONSTRAINT IF EXISTS auto_bids_lot_id_fkey,
ADD CONSTRAINT auto_bids_lot_id_fkey 
FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- Update caucao to cascade on auction_id
ALTER TABLE public.caucao 
DROP CONSTRAINT IF EXISTS caucao_auction_id_fkey,
ADD CONSTRAINT caucao_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

-- Update auction_winners to cascade on lot_id
-- There were two constraints mentioned, let's handle both
ALTER TABLE public.auction_winners 
DROP CONSTRAINT IF EXISTS auction_winners_lot_id_fkey,
ADD CONSTRAINT auction_winners_lot_id_fkey 
FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

ALTER TABLE public.auction_winners 
DROP CONSTRAINT IF EXISTS fk_auction_winners_lot,
ADD CONSTRAINT fk_auction_winners_lot 
FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- Check for any other constraints that might block deletion
-- live_auction_control already has auction_id cascade, and current_lot_id SET NULL.
-- chat_messages already has auction_id cascade.
-- reconciliation_logs already has auction_id cascade and lot_id cascade.
