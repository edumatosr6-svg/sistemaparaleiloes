-- Enable net extension for webhooks if not already enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.on_auction_winner_created()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create the trigger
DROP TRIGGER IF EXISTS tr_on_auction_winner_created ON public.auction_winners;
CREATE TRIGGER tr_on_auction_winner_created
AFTER INSERT ON public.auction_winners
FOR EACH ROW
EXECUTE FUNCTION public.on_auction_winner_created();
