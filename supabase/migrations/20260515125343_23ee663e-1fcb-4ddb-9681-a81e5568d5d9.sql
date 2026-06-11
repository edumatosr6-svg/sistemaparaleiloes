-- 1. Create reconciliation_logs table
CREATE TABLE IF NOT EXISTS public.reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
    expected_value NUMERIC(15,2),
    actual_value NUMERIC(15,2),
    action_taken TEXT,
    resolved_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- Admin only access
CREATE POLICY "Admins can view reconciliation logs" ON public.reconciliation_logs
FOR SELECT USING (public.is_admin());

-- 2. Update reconcile_auction_bids to be more detailed
CREATE OR REPLACE FUNCTION public.reconcile_auction_bids(p_auction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_lot_record RECORD;
    v_correct_max NUMERIC;
    v_fixed_count INTEGER := 0;
    v_discrepancies jsonb := '[]'::jsonb;
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem reconciliar lances.';
    END IF;

    -- Iterate through all lots in the auction
    FOR v_lot_record IN (SELECT id, title, current_highest_bid FROM public.lots WHERE auction_id = p_auction_id) LOOP
        -- Get the true maximum bid
        SELECT MAX(amount) INTO v_correct_max FROM public.bids WHERE lot_id = v_lot_record.id;
        
        -- Check for discrepancy (treating NULL as 0 or starting price isn't needed if we just want it to match bids)
        -- However, if there are no bids, v_correct_max is NULL.
        IF (v_lot_record.current_highest_bid IS DISTINCT FROM v_correct_max) THEN
            -- Log the discrepancy
            INSERT INTO public.reconciliation_logs (
                auction_id, 
                lot_id, 
                expected_value, 
                actual_value, 
                action_taken, 
                created_by
            ) VALUES (
                p_auction_id, 
                v_lot_record.id, 
                v_correct_max, 
                v_lot_record.current_highest_bid, 
                'Price auto-corrected from history scan', 
                auth.uid()
            );

            -- Auto-correct
            UPDATE public.lots SET current_highest_bid = v_correct_max, updated_at = now() WHERE id = v_lot_record.id;
            
            v_fixed_count := v_fixed_count + 1;
            v_discrepancies := v_discrepancies || jsonb_build_object(
                'lot_id', v_lot_record.id,
                'lot_title', v_lot_record.title,
                'old_value', v_lot_record.current_highest_bid,
                'new_value', v_correct_max
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'fixed_count', v_fixed_count,
        'discrepancies', v_discrepancies,
        'message', v_fixed_count || ' discrepâncias encontradas e corrigidas.'
    );
END;
$function$;
