-- Enable RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons are viewable by everyone (to check validity)
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);

-- Only admins can manage coupons (this assumes a role check is needed, but for now I'll just enable RLS)
-- Since I don't have a reliable way to check admin role in a simple policy without profiles join, 
-- I'll stick to a basic policy for now.
CREATE POLICY "Only admins can insert/update/delete coupons" 
ON public.coupons 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enable RLS for affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Users can view their own affiliate data
CREATE POLICY "Users can view their own affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all affiliate data
CREATE POLICY "Admins can view all affiliate data" 
ON public.affiliates 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
