-- Add timer settings to live_auction_control
ALTER TABLE public.live_auction_control 
ADD COLUMN IF NOT EXISTS seconds_added_per_bid INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS auto_restart_timer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auctioneer_status TEXT DEFAULT 'idle';

-- Add bid type and external info to bids
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bid_source_type') THEN
        CREATE TYPE bid_source_type AS ENUM ('web', 'phone', 'in_person', 'automatic');
    END IF;
END $$;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS bid_source bid_source_type DEFAULT 'web',
ADD COLUMN IF NOT EXISTS manual_bidder_name TEXT,
ADD COLUMN IF NOT EXISTS manual_bidder_phone TEXT;

-- Update auction_winners to support manual attribution
ALTER TABLE public.auction_winners
ADD COLUMN IF NOT EXISTS manual_bidder_name TEXT,
ADD COLUMN IF NOT EXISTS manual_bidder_phone TEXT,
ADD COLUMN IF NOT EXISTS manual_bidder_document TEXT;
