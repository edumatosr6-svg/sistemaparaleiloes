ALTER TABLE public.bids ADD COLUMN bid_source TEXT DEFAULT 'web';
COMMENT ON COLUMN public.bids.bid_source IS 'Origem do lance: web, phone, automatic';