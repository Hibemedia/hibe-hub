-- Create table for metricool sync schedule settings
CREATE TABLE public.metricool_sync_schedule (
  id SERIAL PRIMARY KEY,
  interval_hours INTEGER NOT NULL DEFAULT 24 CHECK (interval_hours IN (12, 24)),
  enabled BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  singleton_check BOOLEAN DEFAULT true UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.metricool_sync_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view sync schedule" 
ON public.metricool_sync_schedule 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert sync schedule" 
ON public.metricool_sync_schedule 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update sync schedule" 
ON public.metricool_sync_schedule 
FOR UPDATE 
USING (is_admin_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metricool_sync_schedule_updated_at
BEFORE UPDATE ON public.metricool_sync_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default schedule settings (disabled by default)
INSERT INTO public.metricool_sync_schedule (interval_hours, enabled)
VALUES (24, false);