-- Corrected version of process_finished_lots
CREATE OR REPLACE FUNCTION public.process_finished_lots()
RETURNS void AS $$
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
        -- Find highest bid
        SELECT * INTO v_winning_bid FROM public.bids 
        WHERE lot_id = v_lot.id 
        ORDER BY amount DESC LIMIT 1;

        IF v_winning_bid IS NOT NULL THEN
            -- We have a winner
            UPDATE public.lots SET status = 'sold' WHERE id = v_lot.id;
            
            INSERT INTO public.auction_winners (lot_id, user_id, final_amount, escrow_status)
            VALUES (v_lot.id, v_winning_bid.user_id, v_winning_bid.amount, 'pending')
            RETURNING id INTO v_winner_id;

            -- Create contract record
            INSERT INTO public.contracts (winner_id, status)
            VALUES (v_winner_id, 'draft');

            -- Generate sales note placeholder
            PERFORM public.generate_sales_note(v_winner_id);

            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote vendido com sucesso', jsonb_build_object('lot_id', v_lot.id, 'winner_id', v_winning_bid.user_id, 'amount', v_winning_bid.amount));
            
            -- Trigger refunds for other participants
            FOR v_participant IN 
                SELECT DISTINCT user_id FROM public.bids WHERE lot_id = v_lot.id AND user_id != v_winning_bid.user_id
            LOOP
                PERFORM public.refund_caucao(v_participant.user_id, v_lot.id);
            END LOOP;
        ELSE
            -- No bids
            UPDATE public.lots SET status = 'unsold' WHERE id = v_lot.id;
            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote encerrado sem lances', jsonb_build_object('lot_id', v_lot.id));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
