ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT USING (true);

DO $$
DECLARE admin_id uuid; user_id uuid;
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@teste.com', crypt('Admin@2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '')
  RETURNING id INTO admin_id;
  
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'user@teste.com', crypt('User@2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '')
  RETURNING id INTO user_id;
  
  INSERT INTO public.profiles (id, role) VALUES (admin_id, 'admin'::public.user_role) ON CONFLICT (id) DO UPDATE SET role = 'admin'::public.user_role;
  INSERT INTO public.profiles (id, role) VALUES (user_id, 'user'::public.user_role) ON CONFLICT (id) DO NOTHING;
END $$;