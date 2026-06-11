-- Set search_path and revoke public execute for handle_new_bid
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO authenticated;

-- Set search_path and revoke public execute for process_finished_lots
ALTER FUNCTION public.process_finished_lots() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_finished_lots() TO service_role; -- Only backend should call this

-- Function to refund caucao (deposit)
CREATE OR REPLACE FUNCTION public.refund_caucao(p_user_id UUID, p_lot_id UUID)
RETURNS void AS $$
BEGIN
    -- Logic to trigger a refund (e.g., status change or call to external API)
    UPDATE public.caucao 
    SET status = 'refunded', updated_at = now()
    WHERE user_id = p_user_id AND status = 'approved';
    
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Caução reembolsada', jsonb_build_object('user_id', p_user_id, 'lot_id', p_lot_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execute for refund_caucao
REVOKE EXECUTE ON FUNCTION public.refund_caucao(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_caucao(UUID, UUID) TO service_role;

-- Function to generate sales note
CREATE OR REPLACE FUNCTION public.generate_sales_note(p_winner_id UUID)
RETURNS void AS $$
BEGIN
    -- This would typically be handled by an Edge Function that generates a PDF
    -- For now, we update the status and log it
    UPDATE public.auction_winners 
    SET sales_note_url = 'https://example.com/notes/' || p_winner_id || '.pdf'
    WHERE id = p_winner_id;
    
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Nota de venda gerada', jsonb_build_object('winner_id', p_winner_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execute for generate_sales_note
REVOKE EXECUTE ON FUNCTION public.generate_sales_note(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_sales_note(UUID) TO service_role;
