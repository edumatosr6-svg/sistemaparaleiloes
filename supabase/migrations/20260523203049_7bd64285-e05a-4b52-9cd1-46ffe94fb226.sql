CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    role, 
    full_name, 
    phone, 
    whatsapp, 
    cep, 
    address, 
    address_number, 
    complement, 
    neighborhood, 
    city, 
    state,
    avatar_url
  )
  VALUES (
    NEW.id,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin'::public.user_role) THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'cep',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'address_number',
    NEW.raw_user_meta_data->>'complement',
    NEW.raw_user_meta_data->>'neighborhood',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    cep = EXCLUDED.cep,
    address = EXCLUDED.address,
    address_number = EXCLUDED.address_number,
    complement = EXCLUDED.complement,
    neighborhood = EXCLUDED.neighborhood,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
