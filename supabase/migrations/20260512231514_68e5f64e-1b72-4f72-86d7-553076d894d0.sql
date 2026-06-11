-- Trigger to process finished lots on any bid activity
CREATE OR REPLACE FUNCTION public.trigger_process_finished_lots()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.process_finished_lots();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_process_finished_on_bid ON public.bids;
CREATE TRIGGER tr_process_finished_on_bid
AFTER INSERT ON public.bids
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_process_finished_lots();
