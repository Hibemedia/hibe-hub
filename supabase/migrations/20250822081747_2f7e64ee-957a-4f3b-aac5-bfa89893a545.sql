-- Create function to cleanup old sync logs (older than 31 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Delete old metricool sync logs
  DELETE FROM public.metricool_sync_logs 
  WHERE created_at < NOW() - INTERVAL '31 days';
  
  -- Delete old metricool content sync logs  
  DELETE FROM public.metricool_content_sync_logs
  WHERE created_at < NOW() - INTERVAL '31 days';
END;
$function$

-- Schedule the cleanup to run daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-metricool-logs',
  '0 2 * * *', -- Daily at 2 AM
  $$SELECT public.cleanup_old_sync_logs();$$
);