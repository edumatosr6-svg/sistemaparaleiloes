-- Ensure user_role type exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Backfill profiles from auth.users
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' 
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- If profiles were empty, the above made everyone admin. 
-- Let's ensure at least one is admin if there are any.
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (SELECT id FROM public.profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');

-- Storage Policies for 'auction-assets'
BEGIN;
  -- Drop existing problematic policies if they exist
  DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Manage Assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

  -- Create clean policies
  CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id IN ('auction-assets', 'site-assets'));
  
  CREATE POLICY "Authenticated Manage Assets" ON storage.objects 
  FOR ALL 
  TO authenticated 
  USING (bucket_id IN ('auction-assets', 'site-assets'))
  WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));

  CREATE POLICY "Allow public upload to assets" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));
COMMIT;

-- Ensure Banners RLS is correct
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" 
ON public.banners 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
CREATE POLICY "Banners are viewable by everyone" 
ON public.banners 
FOR SELECT 
TO public
USING (true);
