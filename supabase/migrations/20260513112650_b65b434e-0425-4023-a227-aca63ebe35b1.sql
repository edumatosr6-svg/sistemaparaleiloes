-- Add gallery_urls column to lots table
ALTER TABLE public.lots 
ADD COLUMN gallery_urls TEXT[] DEFAULT '{}';