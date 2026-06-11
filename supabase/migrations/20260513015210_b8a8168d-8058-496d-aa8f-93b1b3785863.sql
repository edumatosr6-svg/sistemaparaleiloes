-- Recriar funções com search_path e permissões restritas
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_lot public.lots;
    v_auction public.auctions;
    v_profile public.profiles;
    v_caucao_status TEXT;
    v_last_bid_time TIMESTAMP WITH TIME ZONE;
    v_min_required_bid NUMERIC;
BEGIN
    SELECT * INTO v_lot FROM public.lots WHERE id = NEW.lot_id;
    SELECT * INTO v_auction FROM public.auctions WHERE id = v_lot.auction_id;
    SELECT * INTO v_profile FROM public.profiles WHERE id = NEW.user_id;

    IF v_profile.is_blocked THEN
        RAISE EXCEPTION 'Sua conta está bloqueada. Entre em contato com o suporte.';
    END IF;

    IF NOT v_profile.is_approved THEN
        RAISE EXCEPTION 'Seu cadastro ainda não foi aprovado. Você não pode dar lances.';
    END IF;

    IF v_lot.status != 'active' THEN
        RAISE EXCEPTION 'Este lote não está aceitando lances no momento.';
    END IF;

    IF v_lot.active_until < now() THEN
        RAISE EXCEPTION 'O tempo para lances neste lote expirou.';
    END IF;

    SELECT status INTO v_caucao_status FROM public.caucao 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC LIMIT 1;

    IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
        RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
    END IF;

    IF v_lot.current_highest_bid IS NULL THEN
        v_min_required_bid := v_lot.starting_price;
    ELSE
        v_min_required_bid := v_lot.current_highest_bid + COALESCE(v_lot.min_increment, 0);
    END IF;

    IF NEW.amount < v_min_required_bid THEN
        RAISE EXCEPTION 'O lance mínimo obrigatório é R$ %', v_min_required_bid;
    END IF;

    SELECT created_at INTO v_last_bid_time FROM public.bids 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_bid_time IS NOT NULL AND (now() - v_last_bid_time) < interval '1 second' THEN
        RAISE EXCEPTION 'Velocidade de lances excedida. Aguarde um segundo.';
    END IF;

    IF v_auction.anti_sniper_enabled AND (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
        UPDATE public.lots 
        SET active_until = now() + (v_auction.extension_seconds * interval '1 second')
        WHERE id = NEW.lot_id;
        
        INSERT INTO public.system_logs (level, message, context)
        VALUES ('info', 'Tempo estendido por anti-sniper', jsonb_build_object(
            'lot_id', NEW.lot_id, 
            'previous_end', v_lot.active_until,
            'new_end', now() + (v_auction.extension_seconds * interval '1 second')
        ));
    END IF;

    UPDATE public.lots SET current_highest_bid = NEW.amount, updated_at = now() WHERE id = NEW.lot_id;

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (NEW.user_id, 'PLACE_BID', 'lot', NEW.lot_id, jsonb_build_object('amount', NEW.amount));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.process_finished_lots()
RETURNS VOID AS $$
DECLARE
    v_lot RECORD;
    v_winning_bid RECORD;
    v_winner_id UUID;
    v_participant RECORD;
BEGIN
    FOR v_lot IN 
        SELECT * FROM public.lots 
        WHERE status = 'active' AND active_until < now()
    LOOP
        SELECT * INTO v_winning_bid FROM public.bids 
        WHERE lot_id = v_lot.id 
        ORDER BY amount DESC, created_at ASC LIMIT 1;

        IF v_winning_bid IS NOT NULL THEN
            UPDATE public.lots SET status = 'sold' WHERE id = v_lot.id;
            
            INSERT INTO public.auction_winners (lot_id, user_id, final_amount, escrow_status)
            VALUES (v_lot.id, v_winning_bid.user_id, v_winning_bid.amount, 'pending')
            RETURNING id INTO v_winner_id;

            INSERT INTO public.contracts (winner_id, status)
            VALUES (v_winner_id, 'signed');

            PERFORM public.generate_sales_note(v_winner_id);

            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote arrematado', jsonb_build_object('lot_id', v_lot.id, 'winner_id', v_winning_bid.user_id));
            
            FOR v_participant IN 
                SELECT DISTINCT user_id FROM public.bids WHERE lot_id = v_lot.id AND user_id != v_winning_bid.user_id
            LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM public.lots l
                    JOIN public.bids b ON b.lot_id = l.id
                    WHERE l.status = 'active' 
                    AND b.user_id = v_participant.user_id
                    AND b.amount = l.current_highest_bid
                ) THEN
                    PERFORM public.refund_caucao(v_participant.user_id, v_lot.id);
                END IF;
            END LOOP;
        ELSE
            UPDATE public.lots SET status = 'unsold' WHERE id = v_lot.id;
            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote não vendido', jsonb_build_object('lot_id', v_lot.id));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_sales_note(p_winner_id uuid)
RETURNS VOID AS $$
BEGIN
    UPDATE public.auction_winners 
    SET sales_note_url = 'https://example.com/notes/' || p_winner_id || '.pdf'
    WHERE id = p_winner_id;
    
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Nota de venda gerada', jsonb_build_object('winner_id', p_winner_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.refund_caucao(p_user_id uuid, p_lot_id uuid)
RETURNS VOID AS $$
BEGIN
    UPDATE public.caucao 
    SET status = 'refunded', updated_at = now()
    WHERE user_id = p_user_id AND status = 'approved';
    
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Caução reembolsada', jsonb_build_object('user_id', p_user_id, 'lot_id', p_lot_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar permissões
REVOKE ALL ON FUNCTION public.handle_new_bid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_finished_lots() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_log_trigger() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_sales_note(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_caucao(uuid, uuid) FROM PUBLIC;

-- Garantir acesso apenas a quem precisa
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_trigger() TO postgres;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO postgres;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.refund_caucao(uuid, uuid) TO postgres;
