-- Create generated_pdfs table
CREATE TABLE IF NOT EXISTS public.generated_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES public.auction_winners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'contract', 'sales_note'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own generated PDFs"
ON public.generated_pdfs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated PDFs"
ON public.generated_pdfs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all generated PDFs"
ON public.generated_pdfs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
