-- Add auction_id column to caucao table
ALTER TABLE public.caucao ADD COLUMN IF NOT EXISTS auction_id UUID REFERENCES public.auctions(id);

-- Update the unique constraint if necessary or just keep it simple for now
-- Drop existing policies for caucao to update them
DROP POLICY IF EXISTS "Admins can manage all caucao" ON public.caucao;
DROP POLICY IF EXISTS "Users can view their own caucao" ON public.caucao;

-- Re-create policies
CREATE POLICY "Admins can manage all caucao" 
ON public.caucao 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own caucao" 
ON public.caucao 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caucao requests" 
ON public.caucao 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy for users to see their own records (already exists above but making sure)
-- Ensure auction_id is indexed for performance
CREATE INDEX IF NOT EXISTS idx_caucao_auction_id ON public.caucao(auction_id);
CREATE INDEX IF NOT EXISTS idx_caucao_user_auction ON public.caucao(user_id, auction_id);