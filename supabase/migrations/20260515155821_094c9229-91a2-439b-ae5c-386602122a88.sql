CREATE OR REPLACE FUNCTION public.on_auction_winner_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into internal notifications table
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Parabéns! Você arrematou um lote!',
      'Você venceu a disputa! O lote agora está disponível para pagamento em seu painel.',
      'won',
      '/dashboard/won'
    );
  END IF;

  -- Call edge function for external notifications (email, etc)
  PERFORM
    net.http_post(
      url := 'https://urnnqxsnyvzbrlkqomrx.supabase.co/functions/v1/notify-winner',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;