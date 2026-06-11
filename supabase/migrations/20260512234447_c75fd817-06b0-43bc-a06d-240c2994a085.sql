-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule Auction Processing (Runs every minute)
-- This ensures lots close automatically even if no one is bidding
SELECT cron.schedule('process-auctions', '* * * * *', 'SELECT public.process_finished_lots()');

-- 3. Ensure Profiles Sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), 
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Initial Seed Data (Only if empty)
INSERT INTO public.categories (name, slug, display_order)
SELECT name, slug, display_order FROM (
  VALUES 
    ('Veículos', 'veiculos', 1),
    ('Imóveis', 'imoveis', 2),
    ('Colecionáveis', 'colecionaveis', 3),
    ('Eletrônicos', 'eletronicos', 4)
) AS t(name, slug, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories);

INSERT INTO public.banners (title, image_url, link_url, is_active, display_order)
SELECT title, image_url, link_url, is_active, display_order FROM (
  VALUES 
    ('Grandes Oportunidades em Veículos', 'https://images.unsplash.com/photo-1514845505178-849c24099355?q=80&w=1600&h=900&auto=format&fit=crop', '/', true, 1),
    ('Imóveis de Luxo com Preços Incríveis', 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=1600&h=900&auto=format&fit=crop', '/', true, 2)
) AS t(title, image_url, link_url, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.banners);

-- 5. Universal RLS Enablement
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP; 
END $$;
