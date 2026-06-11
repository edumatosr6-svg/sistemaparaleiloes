CREATE OR REPLACE FUNCTION public.hammer_lot(p_lot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lot RECORD;
    v_highest_bid RECORD;
    v_user_id UUID;
    v_auction RECORD;
    v_winner_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if lot exists and is active
    SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lote não encontrado';
    END IF;
    
    IF v_lot.status != 'active' THEN
        RAISE EXCEPTION 'O lote não está ativo para arremate';
    END IF;
    
    -- Check if hammer is enabled
    IF NOT v_lot.hammer_enabled THEN
        RAISE EXCEPTION 'O arremate direto não está habilitado para este lote';
    END IF;
    
    -- Find highest bid
    SELECT * INTO v_highest_bid FROM public.bids WHERE lot_id = p_lot_id ORDER BY amount DESC, created_at ASC LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nenhum lance encontrado para este lote';
    END IF;
    
    -- Check if calling user is the leader OR an admin
    IF v_highest_bid.user_id != v_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Apenas o maior licitante pode bater o martelo';
    END IF;
    
    -- Get auction settings
    SELECT * INTO v_auction FROM public.auctions WHERE id = v_lot.auction_id;

    -- Update lot status
    UPDATE public.lots SET status = 'sold' WHERE id = p_lot_id;
    
    -- Insert winner
    INSERT INTO public.auction_winners (
        lot_id, 
        user_id, 
        bid_amount, 
        commission_amount, 
        administrative_amount, 
        final_amount, 
        escrow_status
    )
    VALUES (
        p_lot_id, 
        v_highest_bid.user_id, 
        v_highest_bid.amount, 
        (v_highest_bid.amount * COALESCE(v_auction.commission_rate, 5.00)) / 100,
        COALESCE(v_auction.administrative_fee, 0.00),
        v_highest_bid.amount + ((v_highest_bid.amount * COALESCE(v_auction.commission_rate, 5.00)) / 100) + COALESCE(v_auction.administrative_fee, 0.00),
        'pending'
    )
    RETURNING id INTO v_winner_id;

    -- Create contract
    INSERT INTO public.contracts (winner_id, status)
    VALUES (v_winner_id, 'active');

    -- Insert audit log if table exists, else use system_logs or ignore
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Martelo batido pelo usuário', jsonb_build_object('lot_id', p_lot_id, 'user_id', v_user_id));

END;
$$;