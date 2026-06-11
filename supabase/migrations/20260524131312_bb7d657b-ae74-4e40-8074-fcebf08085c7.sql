-- 1. Protect profiles.role from being changed by the user
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) AND (NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar funções de usuário.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.profiles;
CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_role();

-- 2. Add admin check to process_auction_winners_v2
CREATE OR REPLACE FUNCTION public.process_auction_winners_v2(p_auction_id UUID)
RETURNS void AS $$
DECLARE
    r_lot RECORD;
    r_bid RECORD;
    v_commission_amount NUMERIC;
    v_final_amount NUMERIC;
    v_commission_rate NUMERIC;
    v_admin_fee NUMERIC;
BEGIN
    -- Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem processar ganhadores.';
    END IF;

    -- Get auction settings
    SELECT COALESCE(commission_rate, 5), COALESCE(administrative_fee, 0)
    INTO v_commission_rate, v_admin_fee
    FROM public.auctions 
    WHERE id = p_auction_id;

    FOR r_lot IN 
        SELECT id, title, lot_order 
        FROM public.lots 
        WHERE auction_id = p_auction_id 
    LOOP
        -- Only process if winner doesn't exist yet
        IF NOT EXISTS (SELECT 1 FROM public.auction_winners WHERE lot_id = r_lot.id) THEN
            -- Get highest bid
            SELECT * INTO r_bid
            FROM public.bids
            WHERE lot_id = r_lot.id
            ORDER BY amount DESC
            LIMIT 1;

            IF r_bid IS NOT NULL THEN
                v_commission_amount := (r_bid.amount * v_commission_rate) / 100;
                v_final_amount := r_bid.amount + v_commission_amount + v_admin_fee;

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
                ) VALUES (
                    r_lot.id,
                    r_bid.user_id,
                    r_bid.amount,
                    v_commission_amount,
                    v_admin_fee,
                    v_final_amount,
                    'pending',
                    r_bid.manual_bidder_name,
                    r_bid.manual_bidder_phone
                );

                UPDATE public.lots SET status = 'sold' WHERE id = r_lot.id;
            ELSE
                -- No bids, mark as unsold if it's not already
                UPDATE public.lots SET status = 'unsold' WHERE id = r_lot.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix user_documents policies for admins
CREATE POLICY "Admins can view all user documents"
ON public.user_documents
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update user documents"
ON public.user_documents
FOR UPDATE
USING (public.is_admin());

-- 4. Grant SELECT on profiles_public view to everyone
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 5. Enable public SELECT on auction_winners but exclude sensitive info via logic (or just allow basic fields)
-- Since we can't restrict columns in RLS, and the carousel needs full_name (via profiles join),
-- we need profiles_public to be joined.
-- Let's add a general select policy for auction_winners but advise using a view for public data.
CREATE POLICY "Anyone can view basic winner info"
ON public.auction_winners
FOR SELECT
USING (true);

-- To keep it secure, we should ideally restrict sensitive columns if they were in this table, 
-- but auction_winners has some sensitive fields like manual_bidder_phone.
-- Let's REVISE: Only allow public select for winners, but manual_bidder_phone should be protected.
-- Actually, the best way is to not have sensitive data in public SELECT.
-- I'll drop the "Anyone can view basic winner info" policy and instead use a secure view.

DROP POLICY IF EXISTS "Anyone can view basic winner info" ON public.auction_winners;

CREATE OR REPLACE VIEW public.winners_public AS
SELECT 
    aw.id,
    aw.lot_id,
    aw.user_id,
    aw.final_amount,
    aw.created_at,
    aw.manual_bidder_name,
    l.title as lot_title,
    l.image_url as lot_image_url,
    p.full_name as winner_name
FROM public.auction_winners aw
LEFT JOIN public.lots l ON aw.lot_id = l.id
LEFT JOIN public.profiles_public p ON aw.user_id = p.id;

GRANT SELECT ON public.winners_public TO anon, authenticated;

-- 6. Ensure is_admin is used consistently and securely
-- (Existing is_admin is fine but we've used it in policies above)
