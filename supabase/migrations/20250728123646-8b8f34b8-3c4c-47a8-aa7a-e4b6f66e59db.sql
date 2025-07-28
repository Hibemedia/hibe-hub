-- Create metricool_credentials table (singleton for global API credentials)
CREATE TABLE public.metricool_credentials (
  singleton_check BOOLEAN NOT NULL DEFAULT TRUE PRIMARY KEY,
  access_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on metricool_credentials
ALTER TABLE public.metricool_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for admin-only access
CREATE POLICY "Admins only" ON public.metricool_credentials
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

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

-- Enable RLS on metricool_brands  
ALTER TABLE public.metricool_brands ENABLE ROW LEVEL SECURITY;

-- Create policy for admin-only access
CREATE POLICY "Admins only" ON public.metricool_brands
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Create trigger function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic updated_at updates
CREATE TRIGGER update_metricool_credentials_updated_at
    BEFORE UPDATE ON public.metricool_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metricool_brands_updated_at
    BEFORE UPDATE ON public.metricool_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();