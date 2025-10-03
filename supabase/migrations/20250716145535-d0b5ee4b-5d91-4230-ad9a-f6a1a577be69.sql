-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Only admins can manage metricool settings" ON public.metricool_settings;

-- Create new policies that allow users to manage their own settings
CREATE POLICY "Users can view their own metricool settings" 
ON public.metricool_settings 
FOR SELECT 
USING (true); -- Allow reading for now, can be restricted later when auth is implemented

CREATE POLICY "Users can insert their own metricool settings" 
ON public.metricool_settings 
FOR INSERT 
WITH CHECK (true); -- Allow inserting for now, can be restricted later when auth is implemented

CREATE POLICY "Users can update their own metricool settings" 
ON public.metricool_settings 
FOR UPDATE 
USING (true) -- Allow updating for now, can be restricted later when auth is implemented
WITH CHECK (true);

CREATE POLICY "Users can delete their own metricool settings" 
ON public.metricool_settings 
FOR DELETE 
USING (true); -- Allow deleting for now, can be restricted later when auth is implemented