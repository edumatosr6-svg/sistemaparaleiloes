CREATE OR REPLACE FUNCTION public.reconcile_auction_bids(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'::public.user_role
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem reconciliar lances.';
    END IF;

    -- Update current_highest_bid for all lots in the auction based on the maximum bid amount
    WITH max_bids AS (
        SELECT lot_id, MAX(amount) as max_amount
        FROM bids
        WHERE lot_id IN (SELECT id FROM lots WHERE auction_id = p_auction_id)
        GROUP BY lot_id
    )
    UPDATE lots l
    SET current_highest_bid = mb.max_amount,
        updated_at = now()
    FROM max_bids mb
    WHERE l.id = mb.lot_id 
    AND (l.current_highest_bid IS NULL OR l.current_highest_bid != mb.max_amount);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'updated_lots', v_updated_count,
        'message', v_updated_count || ' lotes reconciliados com sucesso.'
    );
END;
$$;
