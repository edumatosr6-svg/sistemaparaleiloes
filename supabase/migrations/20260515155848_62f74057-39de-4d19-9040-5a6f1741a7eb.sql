CREATE OR REPLACE FUNCTION public.on_payment_confirmed_notify()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to 'paid' and there is a user_id
  IF NEW.escrow_status = 'paid' AND (OLD.escrow_status IS NULL OR OLD.escrow_status != 'paid') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Pagamento Confirmado!',
      'Seu pagamento foi confirmado! O contrato e a nota de venda já estão disponíveis em seu painel.',
      'payment',
      '/dashboard/payments'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS on_payment_confirmed_trigger ON public.auction_winners;

CREATE TRIGGER on_payment_confirmed_trigger
AFTER UPDATE ON public.auction_winners
FOR EACH ROW
EXECUTE FUNCTION public.on_payment_confirmed_notify();