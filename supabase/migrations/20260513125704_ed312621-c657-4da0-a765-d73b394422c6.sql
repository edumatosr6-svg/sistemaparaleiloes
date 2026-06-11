ALTER TABLE public.categories ADD COLUMN image_url TEXT;
CREATE INDEX idx_categories_slug ON public.categories(slug);