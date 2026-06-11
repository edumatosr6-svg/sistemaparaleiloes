-- Add manual_bidder_name to bids
ALTER TABLE public.bids ADD COLUMN manual_bidder_name TEXT;

-- Create a policy to allow admins to insert bids with manual_bidder_name
-- (Existing policies already allow admins via is_admin() in many cases, 
-- but we ensure they can set any user_id or handle the manual bidder case)

-- Function to validate that only the current lot in a live auction can receive bids
CREATE OR REPLACE FUNCTION public.check_live_lot_bidding()
RETURNS TRIGGER AS $$
DECLARE
  v_auction_type auction_type;
  v_current_lot_id UUID;
  v_is_running BOOLEAN;
BEGIN
  -- Get auction type
  SELECT type INTO v_auction_type FROM public.auctions WHERE id = (SELECT auction_id FROM public.lots WHERE id = NEW.lot_id);
  
  -- If it's a live auction, check live control
  IF v_auction_type = 'live' THEN
    SELECT current_lot_id, is_running INTO v_current_lot_id, v_is_running 
    FROM public.live_auction_control 
    WHERE auction_id = (SELECT auction_id FROM public.lots WHERE id = NEW.lot_id);
    
    IF v_current_lot_id IS NULL OR v_current_lot_id != NEW.lot_id THEN
      RAISE EXCEPTION 'Este lote não está aberto para lances no momento.';
    END IF;
    
    IF NOT v_is_running THEN
      RAISE EXCEPTION 'O leilão para este lote está pausado.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to bids to enforce live bidding rules
-- Note: Check if trigger already exists to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_check_live_lot_bidding') THEN
    CREATE TRIGGER tr_check_live_lot_bidding
    BEFORE INSERT ON public.bids
    FOR EACH ROW
    EXECUTE FUNCTION public.check_live_lot_bidding();
  END IF;
END $$;
