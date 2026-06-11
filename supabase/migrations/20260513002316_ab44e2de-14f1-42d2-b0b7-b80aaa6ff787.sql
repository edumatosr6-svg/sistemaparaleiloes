-- Fix Storage Policies
-- First, ensure buckets are public (for reading)
UPDATE storage.buckets SET public = true WHERE id IN ('auction-assets', 'site-assets');

-- Drop existing restrictive policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site-assets" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('auction-assets', 'site-assets'));

-- Ensure system_settings is accessible to admins
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'operator')
  )
);
