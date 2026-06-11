ALTER TABLE public.lots ADD COLUMN buyout_price NUMERIC;
COMMENT ON COLUMN public.lots.buyout_price IS 'The price at which a user can purchase the lot immediately, ending the auction.';