-- Function to notify recipient of a new chat message
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name TEXT;
BEGIN
    -- Only notify if it's a direct message (has recipient_id)
    IF NEW.recipient_id IS NOT NULL THEN
        -- Get sender name
        SELECT full_name INTO v_sender_name 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.recipient_id,
            'Nova mensagem recebida',
            'Você recebeu uma nova mensagem de ' || COALESCE(v_sender_name, 'um usuário') || '.',
            'message',
            '/dashboard' -- Ideally this would link to the specific chat or dashboard
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new chat messages
CREATE TRIGGER tr_notify_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_chat_message();
