-- Remove the id column from metricool_credentials table since it's a singleton
ALTER TABLE public.metricool_credentials DROP COLUMN id;