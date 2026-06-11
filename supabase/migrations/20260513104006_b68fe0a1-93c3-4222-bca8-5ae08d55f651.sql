-- Add columns to caucao table safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caucao' AND column_name='mercadopago_payment_id') THEN
        ALTER TABLE public.caucao ADD COLUMN mercadopago_payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caucao' AND column_name='mercadopago_preference_id') THEN
        ALTER TABLE public.caucao ADD COLUMN mercadopago_preference_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caucao' AND column_name='is_manual_approval') THEN
        ALTER TABLE public.caucao ADD COLUMN is_manual_approval BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caucao' AND column_name='is_refunded') THEN
        ALTER TABLE public.caucao ADD COLUMN is_refunded BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Ensure system_settings has Mercado Pago keys using JSONB
INSERT INTO public.system_settings (key, value, description)
VALUES 
('mercadopago_public_key', '"placeholder_public_key"', 'Public key for Mercado Pago integration'),
('mercadopago_access_token', '"placeholder_access_token"', 'Access token for Mercado Pago integration')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
