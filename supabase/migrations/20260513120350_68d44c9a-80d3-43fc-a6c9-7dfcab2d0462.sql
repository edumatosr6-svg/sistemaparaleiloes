-- Drop the overly permissive select policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- Create a more restrictive select policy
CREATE POLICY "Public settings are viewable by everyone" 
ON public.system_settings 
FOR SELECT 
USING (
  is_admin() OR 
  key IN ('site_config', 'mercadopago_public_key')
);