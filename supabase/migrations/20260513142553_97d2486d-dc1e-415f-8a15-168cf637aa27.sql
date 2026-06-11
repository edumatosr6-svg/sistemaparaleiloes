-- Function to handle new bids
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_anti_sniper_enabled BOOLEAN;
    v_anti_sniper_seconds INTEGER;
    v_extension_seconds INTEGER;
    v_current_active_until TIMESTAMP WITH TIME ZONE;
    v_auction_id UUID;
BEGIN
    -- Update the lot's current highest bid
    UPDATE public.lots
    SET current_highest_bid = NEW.amount,
        updated_at = now()
    WHERE id = NEW.lot_id;

    -- Get auction settings for anti-sniper
    SELECT 
        a.id,
        a.anti_sniper_enabled, 
        a.anti_sniper_seconds,
        a.extension_seconds
    INTO 
        v_auction_id,
        v_anti_sniper_enabled, 
        v_anti_sniper_seconds,
        v_extension_seconds
    FROM public.auctions a
    JOIN public.lots l ON l.auction_id = a.id
    WHERE l.id = NEW.lot_id;

    -- Anti-sniper logic
    IF v_anti_sniper_enabled = true THEN
        SELECT active_until INTO v_current_active_until
        FROM public.lots
        WHERE id = NEW.lot_id;

        -- If current time is within v_anti_sniper_seconds of v_current_active_until
        IF v_current_active_until IS NOT NULL AND (v_current_active_until - now()) < (v_anti_sniper_seconds || ' seconds')::interval THEN
            UPDATE public.lots
            SET active_until = v_current_active_until + (COALESCE(v_extension_seconds, 60) || ' seconds')::interval
            WHERE id = NEW.lot_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new bids
DROP TRIGGER IF EXISTS on_bid_inserted ON public.bids;
CREATE TRIGGER on_bid_inserted
AFTER INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_bid();
