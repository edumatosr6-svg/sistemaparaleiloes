-- Add new columns to existing tables
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS min_increment NUMERIC DEFAULT 100;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS anti_sniper_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS anti_sniper_seconds INTEGER DEFAULT 30;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS extension_seconds INTEGER DEFAULT 60;

-- Create system_logs for general tracking
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_logs for user actions (compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add sales_note_url to auction_winners
ALTER TABLE public.auction_winners ADD COLUMN IF NOT EXISTS sales_note_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see logs
CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to validate a bid
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_lot public.lots;
    v_auction public.auctions;
    v_caucao_status TEXT;
    v_last_bid_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Get lot and auction info
    SELECT * INTO v_lot FROM public.lots WHERE id = NEW.lot_id;
    SELECT * INTO v_auction FROM public.auctions WHERE id = v_lot.auction_id;

    -- 2. Check if auction/lot is active
    IF v_lot.status != 'active' THEN
        RAISE EXCEPTION 'Este lote não está aceitando lances no momento.';
    END IF;

    -- 3. Check Caução (Deposit)
    SELECT status INTO v_caucao_status FROM public.caucao 
    WHERE user_id = auth.uid() 
    ORDER BY created_at DESC LIMIT 1;

    IF v_caucao_status IS NULL OR v_caucao_status != 'approved' THEN
        RAISE EXCEPTION 'Sua caução precisa estar aprovada para participar deste leilão.';
    END IF;

    -- 4. Validate Bid Amount
    IF NEW.amount <= COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment THEN
        RAISE EXCEPTION 'O lance deve ser de pelo menos R$ %', (COALESCE(v_lot.current_highest_bid, v_lot.starting_price - v_lot.min_increment) + v_lot.min_increment);
    END IF;

    -- 5. Rate Limiting (Anti-Bot/Spam)
    -- Check if user placed a bid in the last 2 seconds
    SELECT created_at INTO v_last_bid_time FROM public.bids 
    WHERE user_id = auth.uid() 
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_bid_time IS NOT NULL AND (now() - v_last_bid_time) < interval '2 seconds' THEN
        RAISE EXCEPTION 'Você está enviando lances rápido demais. Aguarde um momento.';
    END IF;

    -- 6. Anti-Sniper Logic
    -- If bid is within the last 'anti_sniper_seconds', extend 'active_until'
    IF v_auction.anti_sniper_enabled AND (v_lot.active_until - now()) < (v_auction.anti_sniper_seconds * interval '1 second') THEN
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
    VALUES (auth.uid(), 'PLACE_BID', 'lot', NEW.lot_id, jsonb_build_object('amount', NEW.amount));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for bidding
DROP TRIGGER IF EXISTS tr_validate_bid ON public.bids;
CREATE TRIGGER tr_validate_bid
BEFORE INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.handle_new_bid();

-- Function to handle auction completion (can be called via cron or background job)
CREATE OR REPLACE FUNCTION public.process_finished_lots()
RETURNS void AS $$
DECLARE
    v_lot RECORD;
    v_winning_bid RECORD;
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
            UPDATE public.lots SET status = 'closed' WHERE id = v_lot.id;
            
            INSERT INTO public.auction_winners (lot_id, user_id, final_amount, escrow_status)
            VALUES (v_lot.id, v_winning_bid.user_id, v_winning_bid.amount, 'pending');

            -- Create contract record
            INSERT INTO public.contracts (winner_id, status)
            SELECT id, 'draft' FROM public.auction_winners WHERE lot_id = v_lot.id;

            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote encerrado com vencedor', jsonb_build_object('lot_id', v_lot.id, 'winner_id', v_winning_bid.user_id));
        ELSE
            -- No bids
            UPDATE public.lots SET status = 'closed' WHERE id = v_lot.id;
            INSERT INTO public.system_logs (level, message, context)
            VALUES ('info', 'Lote encerrado sem lances', jsonb_build_object('lot_id', v_lot.id));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
