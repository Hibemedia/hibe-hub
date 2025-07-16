-- Update RLS policies to work without auth since no authentication is implemented yet
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert their own metricool config" ON public.metricool_config;
DROP POLICY IF EXISTS "Users can update their own metricool config" ON public.metricool_config;
DROP POLICY IF EXISTS "Users can delete their own metricool config" ON public.metricool_config;

-- Create new policies that allow all operations for now (since no auth is implemented)
CREATE POLICY "Allow all operations on metricool_config" 
ON public.metricool_config 
FOR ALL 
USING (true) 
WITH CHECK (true);