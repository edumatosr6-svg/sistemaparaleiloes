-- Ensure live_auction_control records exist for all existing auctions
INSERT INTO public.live_auction_control (auction_id)
SELECT id FROM public.auctions
ON CONFLICT (auction_id) DO NOTHING;

-- Function to automatically create live_auction_control
CREATE OR REPLACE FUNCTION public.handle_new_auction_live_control()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.live_auction_control (auction_id)
    VALUES (NEW.id)
    ON CONFLICT (auction_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create live_auction_control when a new auction is created
DROP TRIGGER IF EXISTS on_auction_created_live_control ON public.auctions;
CREATE TRIGGER on_auction_created_live_control
AFTER INSERT ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auction_live_control();