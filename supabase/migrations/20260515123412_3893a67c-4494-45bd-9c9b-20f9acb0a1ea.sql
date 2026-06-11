-- Function to sync lot highest bid based on bid history
CREATE OR REPLACE FUNCTION public.sync_lot_highest_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_max_bid NUMERIC;
BEGIN
    -- Get the current maximum bid for the affected lot
    SELECT MAX(amount) INTO v_max_bid
    FROM public.bids
    WHERE lot_id = COALESCE(NEW.lot_id, OLD.lot_id);

    -- Update the lot's current_highest_bid
    -- If no bids exist, we don't necessarily set it to NULL, 
    -- we might want to keep it as NULL or the starting_price logic in the app handles it.
    -- However, setting it to the actual max bid (or NULL if no bids) is most accurate.
    UPDATE public.lots
    SET current_highest_bid = v_max_bid,
        updated_at = now()
    WHERE id = COALESCE(NEW.lot_id, OLD.lot_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old triggers that might conflict or be redundant for sync
DROP TRIGGER IF EXISTS tr_sync_lot_price ON public.bids;

-- Create the trigger to handle all bid changes
CREATE TRIGGER tr_sync_lot_price
AFTER INSERT OR UPDATE OR DELETE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.sync_lot_highest_bid();

-- Fix existing discrepancies immediately
UPDATE lots l
SET current_highest_bid = b.max_amount,
    updated_at = now()
FROM (
    SELECT lot_id, MAX(amount) as max_amount
    FROM bids
    GROUP BY lot_id
) b
WHERE l.id = b.lot_id AND (l.current_highest_bid IS NULL OR l.current_highest_bid != b.max_amount);
