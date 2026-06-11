DELETE FROM public.profiles_private WHERE id IN (SELECT id FROM auth.users WHERE email IN ('admin@teste.com', 'user@teste.com'));
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email IN ('admin@teste.com', 'user@teste.com'));
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@teste.com', 'user@teste.com'));
DELETE FROM auth.users WHERE email IN ('admin@teste.com', 'user@teste.com');