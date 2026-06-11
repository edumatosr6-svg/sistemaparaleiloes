-- Add recipient_id column
ALTER TABLE public.chat_messages ADD COLUMN recipient_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_chat_messages_recipient ON public.chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_user_recipient ON public.chat_messages(user_id, recipient_id);

-- Update RLS policies
-- First, drop existing if needed or just add new
CREATE POLICY "Users can view direct messages sent to them" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = recipient_id);

-- Existing policy probably only covers user_id = auth.uid()
-- Let's make sure it exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' AND policyname = 'Users can view their own chat messages'
    ) THEN
        CREATE POLICY "Users can view their own chat messages" 
        ON public.chat_messages 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;
