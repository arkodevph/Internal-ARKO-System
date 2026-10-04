-- Run once against the linked Supabase project. Re-running updates the named job.
-- The GitHub Actions keepalive remains a backup if Supabase Cron is unavailable.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'arko-render-keepalive',
  '*/10 * * * *',
  $$SELECT net.http_get(
    url := 'https://app.arkodevph.com/health',
    timeout_milliseconds := 90000
  );$$
);

COMMIT;
