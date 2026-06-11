CREATE OR REPLACE FUNCTION public.notify_auction_winner()
RETURNS TRIGGER AS $$
DECLARE
    lot_title TEXT;
BEGIN
    -- Get the lot title
    SELECT title INTO lot_title FROM public.lots WHERE id = NEW.lot_id;

    -- Insert notification for the winner
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        NEW.user_id,
        'Você Arrematou!',
        'Parabéns! Você venceu o leilão do lote: ' || lot_title || '. O valor final foi R$ ' || TO_CHAR(NEW.final_amount, 'FM999G999G999D00'),
        'won',
        '/dashboard/won'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auction_winner_inserted
AFTER INSERT ON public.auction_winners
FOR EACH ROW
EXECUTE FUNCTION public.notify_auction_winner();