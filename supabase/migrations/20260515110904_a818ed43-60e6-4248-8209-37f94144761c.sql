CREATE OR REPLACE FUNCTION internal.handle_new_bid()
RETURNS TRIGGER AS $$
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
    -- Skip if admin OR if it's a manual bid (source not 'online')
    IF NOT v_is_admin AND (NEW.bid_source IS NULL OR NEW.bid_source = 'online') THEN
        SELECT status INTO v_caucao_status FROM public.caucao 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC LIMIT 1;

        IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
            RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
        END IF;
    END IF;

    -- 4. Validate Bid Amount (Skip for Admin if desired, but keeping it for safety unless it's a manual adjustment)
    IF NOT v_is_admin AND NEW.amount <= COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment THEN
        RAISE EXCEPTION 'O lance deve ser de pelo menos R$ %', (COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment);
    END IF;

    -- 5. Rate Limiting (Skip for Admin)
    IF NOT v_is_admin THEN
        SELECT created_at INTO v_last_bid_time FROM public.bids 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC LIMIT 1;

        IF v_last_bid_time IS NOT NULL AND (now() - v_last_bid_time) < interval '2 seconds' THEN
            RAISE EXCEPTION 'Você está enviando lances rápido demais. Aguarde um momento.';
        END IF;
    END IF;

    -- 6. Anti-Sniper Logic
    -- If bid is within the last 'anti_sniper_seconds', extend 'active_until'
    IF v_auction.anti_sniper_enabled AND v_lot.active_until IS NOT NULL AND (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
        UPDATE public.lots 
        SET active_until = now() + (v_auction.extension_seconds * interval '1 second')
        WHERE id = NEW.lot_id;
        
        INSERT INTO public.system_logs (level, message, context)
        VALUES ('info', 'Tempo estendido por anti-sniper', jsonb_build_object('lot_id', NEW.lot_id, 'new_active_until', now() + (v_auction.extension_seconds * interval '1 second')));
    END IF;

    -- 7. Update current_highest_bid on lot
    UPDATE public.lots SET current_highest_bid = NEW.amount, updated_at = now() WHERE id = NEW.lot_id;

    -- 8. Audit Log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (auth.uid(), 'PLACE_BID', 'lot', NEW.lot_id, jsonb_build_object('amount', NEW.amount, 'source', NEW.bid_source));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
