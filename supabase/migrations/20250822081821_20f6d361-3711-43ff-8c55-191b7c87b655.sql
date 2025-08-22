-- Schedule the cleanup to run daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-metricool-logs',
  '0 2 * * *',
  'SELECT public.cleanup_old_sync_logs();'
);