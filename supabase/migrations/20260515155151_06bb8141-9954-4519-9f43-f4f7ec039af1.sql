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
    -- Get auction settings
    SELECT commission_rate, administrative_fee 
    INTO v_commission_rate, v_admin_fee
    FROM auctions 
    WHERE id = p_auction_id;

    FOR r_lot IN 
        SELECT id, title, lot_order 
        FROM lots 
        WHERE auction_id = p_auction_id 
        AND status IN ('active', 'sold') -- Re-process even if sold if winner record is missing
    LOOP
        -- Check if winner already exists
        IF NOT EXISTS (SELECT 1 FROM auction_winners WHERE lot_id = r_lot.id) THEN
            -- Get highest bid
            SELECT * INTO r_bid
            FROM bids
            WHERE lot_id = r_lot.id
            ORDER BY amount DESC
            LIMIT 1;

            IF r_bid IS NOT NULL THEN
                v_commission_amount := (r_bid.amount * COALESCE(v_commission_rate, 5)) / 100;
                v_final_amount := r_bid.amount + v_commission_amount + COALESCE(v_admin_fee, 0);

                INSERT INTO auction_winners (
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
                    COALESCE(v_admin_fee, 0),
                    v_final_amount,
                    'pending',
                    r_bid.manual_bidder_name,
                    r_bid.manual_bidder_phone
                );

                UPDATE lots SET status = 'sold' WHERE id = r_lot.id;
            ELSE
                UPDATE lots SET status = 'unsold' WHERE id = r_lot.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;