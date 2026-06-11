ALTER TABLE public.live_auction_control 
ADD COLUMN IF NOT EXISTS transition_message TEXT DEFAULT 'Aguarde o próximo lote...';

-- Add bid_type to bids if not exists to distinguish manual/online
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS bid_source TEXT DEFAULT 'online'; -- 'online', 'phone', 'manual'
