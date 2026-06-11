-- Add streaming_url to auctions
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS streaming_url TEXT;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC(5,2) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    affiliate_code TEXT NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) DEFAULT 5.00,
    total_earnings NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Extend profiles for gamification and loyalty
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cashback_balance NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
