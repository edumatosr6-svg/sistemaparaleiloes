-- Enable pg_cron extension (requires Supabase project with pg_cron enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule process_finished_lots() to run every minute
-- This automatically closes lots whose active_until has passed,
-- creating auction_winners records and updating lot status to sold/unsold
SELECT cron.schedule(
  'process-finished-lots',
  '* * * * *',
  $$SELECT process_finished_lots()$$
);
