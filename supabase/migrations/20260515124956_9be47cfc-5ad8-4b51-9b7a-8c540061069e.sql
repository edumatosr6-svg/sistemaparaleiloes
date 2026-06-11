-- 1. Create profiles_private table
CREATE TABLE IF NOT EXISTS public.profiles_private (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    cpf_cnpj TEXT,
    phone TEXT,
    address TEXT,
    caucao_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cashback_balance NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate existing data
INSERT INTO public.profiles_private (id, cpf_cnpj, phone, address, caucao_balance, cashback_balance, created_at, updated_at)
SELECT id, cpf_cnpj, phone, address, caucao_balance, cashback_balance, created_at, updated_at FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
    cpf_cnpj = EXCLUDED.cpf_cnpj,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    caucao_balance = EXCLUDED.caucao_balance,
    cashback_balance = EXCLUDED.cashback_balance,
    updated_at = EXCLUDED.updated_at;

-- 3. Enable RLS on profiles_private
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own private info" ON public.profiles_private
FOR ALL USING (auth.uid() = id OR public.is_admin());

-- 4. Set up triggers for profiles_private
CREATE OR REPLACE FUNCTION public.handle_new_user_private()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles_private (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_private ON public.profiles;
CREATE TRIGGER on_profile_created_private
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_private();

CREATE TRIGGER set_profiles_private_updated_at BEFORE UPDATE ON public.profiles_private 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Restore broad visibility to profiles (now that sensitive data is removed)
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

-- 6. Clean up profiles table (remove sensitive columns)
-- We do this LAST to ensure data was migrated correctly.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cpf_cnpj;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS caucao_balance;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cashback_balance;
