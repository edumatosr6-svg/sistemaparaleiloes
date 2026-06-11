-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('auction-assets', 'auction-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for public access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'auction-assets' );

CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'auction-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'auction-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'auction-assets' AND auth.role() = 'authenticated' );