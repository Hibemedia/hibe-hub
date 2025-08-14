-- Test een manuele sync voor een specifieke brand
SELECT 
  net.http_post(
    url := 'https://dhrddccjkzzmgitivjas.supabase.co/functions/v1/metricool-sync-brands',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocmRkY2Nqa3p6bWdpdGl2amFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjIzNDgsImV4cCI6MjA2ODMzODM0OH0.j1muhpEt_Q51skqC9ESLh6Jc-OdFTRtFTKS-N1IReaw"}'::jsonb,
    body := '{"source": "manual", "brand_id": 3031826, "force_full": true}'::jsonb
  ) as request_id;