-- Fix the profiles table: Ensure all current users have an admin profile
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Update system_settings policy to ensure it's working
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'operator')
  )
);
