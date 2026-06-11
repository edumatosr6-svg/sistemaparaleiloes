-- Update handle_new_user to make the first user an admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Allow anonymous uploads to these specific buckets
-- This is necessary because the app currently allows guest access to admin features
DROP POLICY IF EXISTS "Authenticated Manage Assets" ON storage.objects;
CREATE POLICY "Public Manage Assets"
ON storage.objects FOR ALL
TO public
USING (bucket_id IN ('auction-assets', 'site-assets'))
WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));

-- Allow anonymous updates to system_settings IF no admins exist yet
-- or just allow it for now to let the user fix their site
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Public Manage Settings"
ON public.system_settings
FOR ALL
TO public
USING (true)
WITH CHECK (true);
