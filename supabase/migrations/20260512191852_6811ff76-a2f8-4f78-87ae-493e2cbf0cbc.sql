-- Create a new storage bucket for auction assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('auction-assets', 'auction-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to view files in the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'auction-assets');

-- Policy to allow authenticated users to upload files
-- In a real app, you might want to restrict this further to only admins
CREATE POLICY "Admins can upload assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'auction-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update/delete their own uploads
CREATE POLICY "Admins can update assets" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'auction-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete assets" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'auction-assets' 
  AND auth.role() = 'authenticated'
);