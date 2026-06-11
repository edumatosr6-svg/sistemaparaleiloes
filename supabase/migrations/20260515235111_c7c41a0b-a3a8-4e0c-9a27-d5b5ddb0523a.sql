-- Create home_sections table
CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active sections" 
ON public.home_sections FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage sections" 
ON public.home_sections FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insert initial sections
INSERT INTO public.home_sections (key, name, display_order) VALUES
('hero', 'Banner Principal (Hero)', 1),
('live_auctions', 'Leilões ao Vivo', 2),
('current_lot', 'Destaque de Lote Atual', 3),
('how_it_works', 'Como Funciona', 4),
('security_rules', 'Regras de Segurança', 5),
('featured_lots', 'Lotes em Destaque', 6),
('stats', 'Estatísticas da Plataforma', 7),
('categories', 'Categorias', 8),
('top_buyers', 'Top Compradores', 9),
('cta', 'Chamada para Ação (CTA)', 10),
('winners_carousel', 'Carrossel de Ganhadores', 11)
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_home_sections_updated_at
BEFORE UPDATE ON public.home_sections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
