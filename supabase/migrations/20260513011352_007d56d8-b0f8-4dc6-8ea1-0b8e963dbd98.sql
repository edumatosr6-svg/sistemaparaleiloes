-- Ajustar permissões de Storage para os buckets de ativos
DROP POLICY IF EXISTS "Allow public upload to assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

CREATE POLICY "Allow Public Select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Allow Public Insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Allow Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Allow Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id IN ('auction-assets', 'site-assets'));

-- Simplificar RLS de banners para garantir funcionamento
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;

CREATE POLICY "Banners are viewable by everyone"
ON public.banners FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage banners"
ON public.banners FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ajustar RLS de system_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public Manage Settings" ON public.system_settings;

CREATE POLICY "Anyone can view settings"
ON public.system_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage settings"
ON public.system_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que a função de novo usuário seja robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar perfis para usuários existentes (caso o trigger tenha falhado anteriormente)
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Garantir que pelo menos um admin existe se houver perfis
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT id FROM public.profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');
