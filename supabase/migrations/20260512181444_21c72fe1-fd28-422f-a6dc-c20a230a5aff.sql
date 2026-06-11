
-- Create auction types enum
CREATE TYPE public.auction_type AS ENUM ('live', 'simultaneous');
CREATE TYPE public.auction_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.lot_status AS ENUM ('pending', 'active', 'sold', 'unsold', 'cancelled');

-- Create auctions table
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type public.auction_type NOT NULL,
  status public.auction_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lots table
CREATE TABLE public.lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status public.lot_status NOT NULL DEFAULT 'pending',
  starting_price DECIMAL(15, 2) NOT NULL,
  current_highest_bid DECIMAL(15, 2),
  lot_order INTEGER,
  active_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  is_automatic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bid history for disputes table
CREATE TABLE public.bid_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live auction control table
CREATE TABLE public.live_auction_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL UNIQUE REFERENCES public.auctions(id) ON DELETE CASCADE,
  current_lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  is_running BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE,
  current_lot_started_at TIMESTAMP WITH TIME ZONE,
  lot_time_limit_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auction winners table
CREATE TABLE public.auction_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL UNIQUE REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  final_amount DECIMAL(15, 2) NOT NULL,
  escrow_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_auction_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Auctions are viewable by everyone" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Users can create auctions" ON public.auctions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Auction creators can update their auctions" ON public.auctions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Auction creators can delete their auctions" ON public.auctions FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for lots
CREATE POLICY "Lots are viewable by everyone" ON public.lots FOR SELECT USING (true);
CREATE POLICY "Auction creators can manage lots" ON public.lots FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auctions WHERE id = auction_id AND created_by = auth.uid()
    )
  );
CREATE POLICY "Auction creators can update lots" ON public.lots FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.auctions WHERE id = auction_id AND created_by = auth.uid()
    )
  );
CREATE POLICY "Auction creators can delete lots" ON public.lots FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.auctions WHERE id = auction_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for bids
CREATE POLICY "Bids are viewable by everyone" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Users can create bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own bids" ON public.bids FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for bid_history
CREATE POLICY "Bid history is viewable by everyone" ON public.bid_history FOR SELECT USING (true);

-- RLS Policies for live_auction_control
CREATE POLICY "Live auction control viewable by everyone" ON public.live_auction_control FOR SELECT USING (true);
CREATE POLICY "Auction creators can manage live control" ON public.live_auction_control FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auctions WHERE id = auction_id AND created_by = auth.uid()
    )
  );
CREATE POLICY "Auction creators can update live control" ON public.live_auction_control FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.auctions WHERE id = auction_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for auction_winners
CREATE POLICY "Winners can view their wins" ON public.auction_winners FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.lots JOIN public.auctions ON auctions.id = lots.auction_id WHERE lots.id = lot_id AND auctions.created_by = auth.uid()));

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_auction_control;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_winners;

-- Create indexes for performance
CREATE INDEX idx_auctions_created_by ON public.auctions(created_by);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_lots_auction_id ON public.lots(auction_id);
CREATE INDEX idx_lots_status ON public.lots(status);
CREATE INDEX idx_bids_lot_id ON public.bids(lot_id);
CREATE INDEX idx_bids_user_id ON public.bids(user_id);
CREATE INDEX idx_bids_created_at ON public.bids(created_at);
CREATE INDEX idx_live_auction_control_auction_id ON public.live_auction_control(auction_id);
CREATE INDEX idx_auction_winners_lot_id ON public.auction_winners(lot_id);
CREATE INDEX idx_auction_winners_user_id ON public.auction_winners(user_id);
