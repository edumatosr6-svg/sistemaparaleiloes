-- Add avatar_url to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Add foreign key to bids table for user_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bids_user_id_fkey') THEN
        ALTER TABLE public.bids 
        ADD CONSTRAINT bids_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key to bid_history table for user_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bid_history_user_id_fkey') THEN
        ALTER TABLE public.bid_history 
        ADD CONSTRAINT bid_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure RLS is enabled and policies are correct
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Re-create the "viewable by everyone" policy if needed to be sure
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
CREATE POLICY "Bids are viewable by everyone" 
ON public.bids 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create bids" ON public.bids;
CREATE POLICY "Users can create bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
