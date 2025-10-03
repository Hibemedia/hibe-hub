-- Create tables for Metricool API integration

-- Table for storing Metricool configuration per client
CREATE TABLE public.metricool_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL, -- Reference to client/customer
  blog_id INTEGER NOT NULL, -- Metricool brand ID
  user_id INTEGER NOT NULL, -- Metricool user ID
  brand_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing daily metrics
CREATE TABLE public.metricool_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  blog_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL, -- e.g., 'igFollowers', 'ttViews', etc.
  metric_date DATE NOT NULL,
  metric_value NUMERIC NOT NULL,
  platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'facebook', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, blog_id, metric_name, metric_date)
);

-- Table for storing posts/content data
CREATE TABLE public.metricool_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  blog_id INTEGER NOT NULL,
  post_id TEXT NOT NULL, -- Metricool post ID
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL, -- 'reel', 'post', 'video', etc.
  caption TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  metrics JSONB DEFAULT '{}', -- Store likes, views, reach, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, blog_id, post_id, platform)
);

-- Table for storing admin/global Metricool settings
CREATE TABLE public.metricool_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_token TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_metricool_metrics_client_date ON public.metricool_metrics(client_id, metric_date);
CREATE INDEX idx_metricool_metrics_blog_date ON public.metricool_metrics(blog_id, metric_date);
CREATE INDEX idx_metricool_posts_client_published ON public.metricool_posts(client_id, published_at);
CREATE INDEX idx_metricool_config_client ON public.metricool_config(client_id);

-- Enable RLS
ALTER TABLE public.metricool_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client access
CREATE POLICY "Users can view their own metricool config"
ON public.metricool_config FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Users can view their own metrics"
ON public.metricool_metrics FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Users can view their own posts"
ON public.metricool_posts FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Admin-only policies for metricool_settings
CREATE POLICY "Only admins can manage metricool settings"
ON public.metricool_settings FOR ALL
TO authenticated
USING (true) -- We'll add proper admin role checking later
WITH CHECK (true);

-- Admin policies for managing client configurations
CREATE POLICY "Admins can manage all metricool configs"
ON public.metricool_config FOR ALL
TO authenticated
USING (true) -- We'll add proper admin role checking later
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_metricool_config_updated_at
  BEFORE UPDATE ON public.metricool_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metricool_settings_updated_at
  BEFORE UPDATE ON public.metricool_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();