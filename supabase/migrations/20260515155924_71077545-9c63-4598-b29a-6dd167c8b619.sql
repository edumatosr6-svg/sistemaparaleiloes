CREATE OR REPLACE FUNCTION public.notify_outbid()
RETURNS TRIGGER AS $$
DECLARE
  v_old_bidder_id UUID;
  v_lot_title TEXT;
BEGIN
  -- Get the previous highest bidder for this lot
  -- This is an AFTER trigger, so NEW is already included in any queries unless we filter it out
  SELECT user_id INTO v_old_bidder_id
  FROM public.bids
  WHERE lot_id = NEW.lot_id
    AND id != NEW.id -- Filter out the current new bid
  ORDER BY amount DESC
  LIMIT 1;

  -- If there was a previous bidder and it's not the same person as the new bidder
  IF v_old_bidder_id IS NOT NULL AND v_old_bidder_id != NEW.user_id THEN
    -- Get lot title
    SELECT title INTO v_lot_title FROM public.lots WHERE id = NEW.lot_id;

    -- Notify the old bidder
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_old_bidder_id,
      'Seu lance foi superado!',
      'Alguém fez um lance maior no lote "' || v_lot_title || '". Volte para a disputa!',
      'outbid',
      '/lot/' || NEW.lot_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_bid_outbid_notification ON public.bids;

CREATE TRIGGER on_bid_outbid_notification
AFTER INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.notify_outbid();