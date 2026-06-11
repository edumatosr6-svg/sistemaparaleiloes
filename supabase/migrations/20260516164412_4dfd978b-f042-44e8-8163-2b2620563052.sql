-- Fix chat_messages policy to prevent exposure of direct messages
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;

CREATE POLICY "Anyone can view public chat messages" 
ON public.chat_messages
FOR SELECT 
USING (recipient_id IS NULL);
