-- 1. Ensure views use security_invoker = true
ALTER VIEW public.profiles_public SET (security_invoker = true);
ALTER VIEW public.winners_public SET (security_invoker = true);

-- 2. Revoke PUBLIC execute on sensitive functions
REVOKE EXECUTE ON FUNCTION public.process_auction_winners_v2(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hammer_lot(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_sales_note(UUID) FROM PUBLIC;

-- Re-grant to authenticated
GRANT EXECUTE ON FUNCTION public.process_auction_winners_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hammer_lot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(UUID) TO authenticated;

-- 3. Create a function to automatically generate a contract for new winners
CREATE OR REPLACE FUNCTION public.handle_new_winner_contract()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.contracts (winner_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Add the trigger to auction_winners
DROP TRIGGER IF EXISTS tr_generate_winner_contract ON public.auction_winners;
CREATE TRIGGER tr_generate_winner_contract
AFTER INSERT ON public.auction_winners
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_winner_contract();

-- 5. Cleanup hammer_lot to not manually insert contract (avoid duplication)
CREATE OR REPLACE FUNCTION public.hammer_lot(p_lot_id UUID)
RETURNS void AS $$
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
    
    -- Insert winner (trigger will handle contract)
    INSERT INTO public.auction_winners (
        lot_id, 
        user_id, 
        bid_amount, 
        commission_amount, 
        administrative_amount, 
        final_amount, 
        escrow_status,
        manual_bidder_name,
        manual_bidder_phone
    )
    VALUES (
        p_lot_id, 
        v_highest_bid.user_id, 
        v_highest_bid.amount, 
        (v_highest_bid.amount * COALESCE(v_auction.commission_rate, 5.00)) / 100,
        COALESCE(v_auction.administrative_fee, 0.00),
        v_highest_bid.amount + ((v_highest_bid.amount * COALESCE(v_auction.commission_rate, 5.00)) / 100) + COALESCE(v_auction.administrative_fee, 0.00),
        'pending',
        v_highest_bid.manual_bidder_name,
        v_highest_bid.manual_bidder_phone
    );

    -- Audit log
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Martelo batido com sucesso', jsonb_build_object('lot_id', p_lot_id, 'user_id', v_user_id));

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
