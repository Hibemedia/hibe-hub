-- Enable cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run daily sync at 2 AM
SELECT cron.schedule(
  'metricool-daily-sync',
  '0 2 * * *', -- Daily at 2 AM
  $$
  select
    net.http_post(
        url:='https://szhfuosuldookhvmreti.supabase.co/functions/v1/metricool-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aGZ1b3N1bGRvb2todm1yZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzU4NDgsImV4cCI6MjA2ODI1MTg0OH0.dqVMOnliktVVz5mhQbwVJtDcjQv2kFpAnnYcP_66YWY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);