-- Create metricool_brands table
CREATE TABLE public.metricool_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  platforms JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.metricool_brands ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admins can access metricool brands" 
ON public.metricool_brands 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metricool_brands_updated_at
BEFORE UPDATE ON public.metricool_brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();