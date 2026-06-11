-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS document TEXT,
ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'PF',
ADD COLUMN IF NOT EXISTS corporate_name TEXT,
ADD COLUMN IF NOT EXISTS trade_name TEXT;

-- Update handle_new_user to include new fields
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
    avatar_url,
    document,
    person_type,
    corporate_name,
    trade_name
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
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'document',
    COALESCE(NEW.raw_user_meta_data->>'person_type', 'PF'),
    NEW.raw_user_meta_data->>'corporate_name',
    NEW.raw_user_meta_data->>'trade_name'
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
    document = EXCLUDED.document,
    person_type = EXCLUDED.person_type,
    corporate_name = EXCLUDED.corporate_name,
    trade_name = EXCLUDED.trade_name,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
