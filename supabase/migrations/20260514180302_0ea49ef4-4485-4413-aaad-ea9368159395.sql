ALTER TABLE public.auctions 
ADD COLUMN streaming_active BOOLEAN DEFAULT false,
ADD COLUMN streaming_playing BOOLEAN DEFAULT true;