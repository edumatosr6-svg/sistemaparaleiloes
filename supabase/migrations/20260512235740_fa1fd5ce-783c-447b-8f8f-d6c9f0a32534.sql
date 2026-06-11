-- Insert default site config if not exists
INSERT INTO public.system_settings (key, value, description)
SELECT 'site_config', '{"name": "Plataforma de Leilões", "phone": "", "whatsapp": "", "logo_url": "", "auctioneer_name": "", "auctioneer_registration": ""}'::jsonb, 'Global site configuration'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'site_config');

-- Ensure storage bucket 'auction-assets' is public
UPDATE storage.buckets SET public = true WHERE id = 'auction-assets';

-- Create 'site-assets' bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for site-assets (with IF NOT EXISTS logic via dropping first or using DO blocks)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access for site-assets" ON storage.objects;
    CREATE POLICY "Public Access for site-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-assets');

    DROP POLICY IF EXISTS "Admins can upload to site-assets" ON storage.objects;
    CREATE POLICY "Admins can upload to site-assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Admins can update site-assets" ON storage.objects;
    CREATE POLICY "Admins can update site-assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Admins can delete site-assets" ON storage.objects;
    CREATE POLICY "Admins can delete site-assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');
END
$$;
