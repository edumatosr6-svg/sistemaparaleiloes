-- Table for user documents
CREATE TABLE public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL, -- 'cpf', 'rg', 'cnh', 'proof_of_address'
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for favorites (can favorite both auctions and lots)
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    auction_id UUID REFERENCES public.auctions(id),
    lot_id UUID REFERENCES public.lots(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, auction_id, lot_id)
);

-- Table for notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'bid_outdone', 'auction_won', 'payment_pending', 'system'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for auto bids
CREATE TABLE public.auto_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lot_id UUID REFERENCES public.lots(id) NOT NULL,
    max_amount NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, lot_id)
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own documents" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload their own documents" ON public.user_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own auto bids" ON public.auto_bids FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_auto_bids_updated_at BEFORE UPDATE ON public.auto_bids FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
