-- Drop redundant triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_bid_inserted ON public.bids;
DROP TRIGGER IF EXISTS tr_validate_bid ON public.bids;

-- Ensure internal schema exists (usually it does in this project)
CREATE SCHEMA IF NOT EXISTS internal;

-- Consolidate into a single robust trigger function
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_lot public.lots;
    v_auction public.auctions;
    v_caucao_status TEXT;
    v_last_bid_time TIMESTAMP WITH TIME ZONE;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Get lot and auction info with row lock to prevent race conditions
    SELECT * INTO v_lot FROM public.lots WHERE id = NEW.lot_id FOR UPDATE;
    SELECT * INTO v_auction FROM public.auctions WHERE id = v_lot.auction_id;

    -- 2. Check if auction/lot is active
    IF v_lot.status != 'active' THEN
        RAISE EXCEPTION 'Este lote não está aceitando lances no momento.';
    END IF;

    -- Check if current user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'::public.user_role
    ) INTO v_is_admin;

    -- 3. Check Caução (Deposit)
    -- Skip if admin OR if it's a manual/admin bid source
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online' OR NEW.bid_source = 'web') THEN
        SELECT status INTO v_caucao_status FROM public.caucao
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
            RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
        END IF;
    END IF;

    -- 4. Validate Bid Amount
    -- Even for admins, we should generally ensure the bid is higher than the current one
    -- unless it's a manual adjustment (which should be handled differently)
    IF NEW.amount <= COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) THEN
        -- Allow admins to place equal bids for manual corrections if needed, but usually we want higher
        IF NOT v_is_admin OR NEW.amount < COALESCE(v_lot.current_highest_bid, v_lot.starting_price) THEN
             RAISE EXCEPTION 'O lance de R$ % deve ser maior que o lance atual de R$ %', NEW.amount, COALESCE(v_lot.current_highest_bid, v_lot.starting_price);
        END IF;
    END IF;

    -- 5. Rate Limiting (Skip for Admin)
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online' OR NEW.bid_source = 'web') THEN
        SELECT created_at INTO v_last_bid_time FROM public.bids
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_last_bid_time IS NOT NULL AND (now() - v_last_bid_time) < interval '1 second' THEN
            RAISE EXCEPTION 'Você está enviando lances rápido demais. Aguarde um momento.';
        END IF;
    END IF;

    -- 6. Anti-Sniper Logic
    IF v_auction.extension_enabled AND v_lot.active_until IS NOT NULL THEN
        IF (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
            UPDATE public.lots
            SET active_until = now() + (v_auction.extension_seconds * interval '1 second')
            WHERE id = NEW.lot_id;
        END IF;
    END IF;

    -- 7. Update current_highest_bid on lot ONLY IF it's actually higher
    -- This prevents race conditions where a lower bid might overwrite a higher one
    IF NEW.amount > COALESCE(v_lot.current_highest_bid, 0) THEN
        UPDATE public.lots 
        SET current_highest_bid = NEW.amount, 
            updated_at = now() 
        WHERE id = NEW.lot_id;
    END IF;

    -- 8. Audit Log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (NEW.user_id, 'PLACE_BID', 'lot', NEW.lot_id, jsonb_build_object('amount', NEW.amount, 'source', NEW.bid_source, 'manual_name', NEW.manual_bidder_name));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger as a BEFORE trigger to ensure validation and lot update happen atomically
CREATE TRIGGER tr_handle_bid
BEFORE INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_bid();
