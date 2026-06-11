ALTER TABLE public.auction_winners
ADD CONSTRAINT fk_auction_winners_lot
FOREIGN KEY (lot_id) REFERENCES public.lots(id);

ALTER TABLE public.auction_winners
ADD CONSTRAINT fk_auction_winners_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id);