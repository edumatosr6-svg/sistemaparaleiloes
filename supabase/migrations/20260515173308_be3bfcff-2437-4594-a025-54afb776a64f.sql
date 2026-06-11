-- Function to process auto-bids
CREATE OR REPLACE FUNCTION public.execute_auto_bids()
RETURNS TRIGGER AS $$
DECLARE
    v_lot public.lots;
    v_highest_auto_bid RECORD;
    v_next_bid_amount NUMERIC;
    v_min_increment NUMERIC;
BEGIN
    -- 1. Get lot info
    SELECT * INTO v_lot FROM public.lots WHERE id = NEW.lot_id;
    v_min_increment := COALESCE(v_lot.min_increment, 100);

    -- 2. Find the highest auto-bid for this lot that is still valid
    -- and belongs to a different user than the current bidder
    SELECT * INTO v_highest_auto_bid
    FROM public.auto_bids
    WHERE lot_id = NEW.lot_id
      AND user_id != NEW.user_id
      AND max_amount >= (NEW.amount + v_min_increment)
    ORDER BY max_amount DESC, created_at ASC
    LIMIT 1;

    -- 3. If an auto-bid is found, place a new bid
    IF v_highest_auto_bid IS NOT NULL THEN
        -- Calculate next bid amount
        v_next_bid_amount := NEW.amount + v_min_increment;
        
        -- Double check if there's another auto-bid that would compete
        -- If so, we might need to jump directly to the point where one wins
        -- But for simplicity and real-time feel, we'll just place one increment
        
        INSERT INTO public.bids (lot_id, user_id, amount, is_automatic, bid_source)
        VALUES (NEW.lot_id, v_highest_auto_bid.user_id, v_next_bid_amount, TRUE, 'automatic');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to execute auto-bids after a new bid is placed
-- We use AFTER INSERT so the current bid is already the highest
CREATE TRIGGER tr_execute_auto_bids
AFTER INSERT ON public.bids
FOR EACH ROW
WHEN (NEW.bid_source IS DISTINCT FROM 'automatic') -- Prevent infinite recursion loops by only triggering on manual bids
EXECUTE FUNCTION public.execute_auto_bids();
