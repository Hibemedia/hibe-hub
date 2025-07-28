-- Create table for Metricool API credentials
CREATE TABLE public.metricool_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.metricool_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Only admins can access metricool credentials" 
ON public.metricool_credentials 
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metricool_credentials_updated_at
BEFORE UPDATE ON public.metricool_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();