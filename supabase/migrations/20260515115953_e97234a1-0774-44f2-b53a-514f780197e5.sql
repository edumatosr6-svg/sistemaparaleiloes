CREATE OR REPLACE FUNCTION public.handle_new_bid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_lot public.lots;
    v_auction public.auctions;
    v_caucao_status TEXT;
    v_last_bid_time TIMESTAMP WITH TIME ZONE;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Get lot and auction info
    SELECT * INTO v_lot FROM public.lots WHERE id = NEW.lot_id;
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
    -- Manual sources are anything NOT 'online' AND NOT 'web' AND NOT NULL
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online' OR NEW.bid_source = 'web') THEN
        SELECT status INTO v_caucao_status FROM public.caucao 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC LIMIT 1;

        IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
            RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
        END IF;
    END IF;

    -- 4. Validate Bid Amount (Skip for Admin or manual sources)
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online' OR NEW.bid_source = 'web') THEN
        IF NEW.amount <= COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment THEN
            RAISE EXCEPTION 'O lance deve ser de pelo menos R$ %', (COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment);
        END IF;
    END IF;

    -- 5. Rate Limiting (Skip for Admin or manual sources)
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online' OR NEW.bid_source = 'web') THEN
        SELECT created_at INTO v_last_bid_time FROM public.bids 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC LIMIT 1;

        IF v_last_bid_time IS NOT NULL AND (now() - v_last_bid_time) < interval '2 seconds' THEN
            RAISE EXCEPTION 'Você está enviando lances rápido demais. Aguarde um momento.';
        END IF;
    END IF;

    -- 6. Anti-Sniper Logic
    IF v_auction.anti_sniper_enabled AND v_lot.active_until IS NOT NULL AND (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
        UPDATE public.lots 
        SET active_until = now() + (v_auction.extension_seconds * interval '1 second')
        WHERE id = NEW.lot_id;
    END IF;

    -- 7. Update current_highest_bid on lot
    UPDATE public.lots SET current_highest_bid = NEW.amount, updated_at = now() WHERE id = NEW.lot_id;

    RETURN NEW;
END;
$function$
;