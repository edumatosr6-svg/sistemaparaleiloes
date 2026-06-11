CREATE OR REPLACE FUNCTION public.handle_new_bid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        -- Check if user has an approved caucao for this auction OR a general one (if auction_id is null)
        SELECT status INTO v_caucao_status FROM public.caucao
        WHERE user_id = NEW.user_id AND (auction_id = v_lot.auction_id OR auction_id IS NULL)
        ORDER BY created_at DESC LIMIT 1;

        IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
            RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
        END IF;
    END IF;

    -- 4. Validate Bid Amount
    IF NEW.amount <= COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) THEN
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
    IF v_auction.anti_sniper_enabled AND v_lot.active_until IS NOT NULL THEN
        IF (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
            UPDATE public.lots
            SET active_until = now() + (v_auction.extension_seconds * interval '1 second')
            WHERE id = NEW.lot_id;
        END IF;
    END IF;

    -- 7. Update current_highest_bid on lot ONLY IF it's actually higher
    IF NEW.amount > COALESCE(v_lot.current_highest_bid, 0) THEN
        UPDATE public.lots 
        SET current_highest_bid = NEW.amount, 
            updated_at = now() 
        WHERE id = NEW.lot_id;
    END IF;

    -- 8. Audit Log (using audit_logs if it exists, otherwise fallback to system_logs)
    BEGIN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
        VALUES (NEW.user_id, 'PLACE_BID', 'lot', NEW.lot_id, jsonb_build_object('amount', NEW.amount, 'source', NEW.bid_source, 'manual_name', NEW.manual_bidder_name));
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.system_logs (level, message, context)
        VALUES ('info', 'Lance registrado', jsonb_build_object('user_id', NEW.user_id, 'lot_id', NEW.lot_id, 'amount', NEW.amount));
    END;

    RETURN NEW;
END;
$function$;