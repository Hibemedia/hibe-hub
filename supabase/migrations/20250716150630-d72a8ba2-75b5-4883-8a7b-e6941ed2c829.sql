-- Change client_id column type from UUID to TEXT to accept any client identifier
ALTER TABLE public.metricool_config 
ALTER COLUMN client_id TYPE TEXT;