-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin'::user_role)
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to contracts(winner_id) if it doesn't exist
-- This allows us to use upsert safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'contracts_winner_id_key'
    ) THEN
        ALTER TABLE public.contracts ADD CONSTRAINT contracts_winner_id_key UNIQUE (winner_id);
    END IF;
END $$;
