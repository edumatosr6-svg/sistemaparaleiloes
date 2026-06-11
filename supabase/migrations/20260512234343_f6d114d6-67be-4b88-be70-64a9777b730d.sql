-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Ensure users can still update their own profiles (already exists, but just in case)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Ensure public visibility (already exists, but just in case)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
