ALTER TABLE public.lots ADD COLUMN buyout_enabled BOOLEAN DEFAULT true;
UPDATE public.lots SET buyout_enabled = true;