-- Add constraint to ensure only one row can exist in metricool_credentials
-- First, add a check column that's always TRUE
ALTER TABLE public.metricool_credentials 
ADD COLUMN singleton_check BOOLEAN NOT NULL DEFAULT TRUE;

-- Create unique constraint on the singleton_check column to ensure only one row
ALTER TABLE public.metricool_credentials 
ADD CONSTRAINT metricool_credentials_singleton UNIQUE (singleton_check);

-- Add comment to explain the constraint
COMMENT ON COLUMN public.metricool_credentials.singleton_check IS 'Always TRUE - ensures only one row can exist in this table';
COMMENT ON TABLE public.metricool_credentials IS 'Global Metricool API credentials - only one row allowed';