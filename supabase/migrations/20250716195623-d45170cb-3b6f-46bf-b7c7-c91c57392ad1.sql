-- Fix RLS policies for metricool_config table to allow users to insert their own configurations

-- First, let's add a policy that allows users to insert their own configurations
CREATE POLICY "Users can insert their own metricool config" 
ON public.metricool_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id_ref);

-- Also add a policy that allows users to update their own configurations
CREATE POLICY "Users can update their own metricool config" 
ON public.metricool_config 
FOR UPDATE 
USING (auth.uid() = user_id_ref);

-- And allow users to delete their own configurations
CREATE POLICY "Users can delete their own metricool config" 
ON public.metricool_config 
FOR DELETE 
USING (auth.uid() = user_id_ref);