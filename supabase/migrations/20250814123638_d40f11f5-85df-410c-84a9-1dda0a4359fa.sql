-- Test de Metricool posts API
SELECT 
  net.http_post(
    url := 'https://dhrddccjkzzmgitivjas.supabase.co/functions/v1/metricool-test-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocmRkY2Nqa3p6bWdpdGl2amFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjIzNDgsImV4cCI6MjA2ODMzODM0OH0.j1muhpEt_Q51skqC9ESLh6Jc-OdFTRtFTKS-N1IReaw"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;