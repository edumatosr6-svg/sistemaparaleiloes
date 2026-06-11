-- Fix search_path for handle_new_bid
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
