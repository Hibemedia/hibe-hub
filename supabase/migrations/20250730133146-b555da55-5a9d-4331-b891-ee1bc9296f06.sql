-- Create metricool_brands table with all 88 specified fields
CREATE TABLE public.metricool_brands (
  id integer PRIMARY KEY,
  userId integer,
  ownerUserId integer,
  label text,
  url text,
  title text,
  description text,
  picture text,
  twitter text,
  facebook text,
  facebookPageId text,
  facebookGroup text,
  facebookGroupId text,
  instagram text,
  fbBusinessId text,
  googlePlus text,
  linkedinCompany text,
  facebookAds text,
  adwords text,
  gmb text,
  youtube text,
  twitch text,
  tiktokads text,
  pinterest text,
  tiktok text,
  threads text,
  bluesky text,
  feedRss text,
  tiktokAccountType text,
  instagramConnectionType text,
  twitterPicture text,
  twitterSubscriptionType text,
  facebookPicture text,
  facebookGroupPicture text,
  instagramPicture text,
  linkedInPicture text,
  facebookAdsPicture text,
  facebookAdsName text,
  pinterestPicture text,
  pinterestBusiness text,
  tiktokPicture text,
  tiktokBusinessTokenExpiration text,
  threadsPicture text,
  threadsAccountName text,
  blueskyPicture text,
  blueskyHandle text,
  fbUserId text,
  inUserId text,
  adwordsUserId text,
  adwordsAccountName text,
  gmbUserId text,
  gmbAccountName text,
  gmbAddress text,
  gmbUrl text,
  tiktokadsUserId text,
  linkedInCompanyPicture text,
  linkedInCompanyName text,
  linkedInTokenExpiration text,
  linkedInUserProfileURL text,
  youtubeChannelName text,
  youtubeChannelPicture text,
  twitchName text,
  twitchPicture text,
  twitchChannelId text,
  tiktokadsDisplayName text,
  tiktokadsPicture text,
  tiktokUserProfileUrl text,
  isShared boolean DEFAULT false,
  ownerUsername text,
  whiteLabelLink text,
  analyticModeWhitelabelLink text,
  whiteLabelAlias text,
  hash text,
  version text,
  frontendVersion text,
  role text,
  deleteDate timestamp with time zone,
  deleted boolean DEFAULT false,
  joinDate timestamp with time zone,
  firstConnectionDate timestamp with time zone,
  lastResolvedInboxMessageTimestamp timestamp with time zone,
  lastReadInboxMessageTimestamp timestamp with time zone,
  timezone text,
  availableConnectors text,
  brandRole text,
  isWhiteLabel boolean DEFAULT false,
  isWhiteLabelOnlyRead boolean DEFAULT false,
  engagementRatio real,
  raw_data jsonb,
  last_synced_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create metricool_sync_logs table
CREATE TABLE public.metricool_sync_logs (
  id serial PRIMARY KEY,
  started_at timestamp with time zone DEFAULT now(),
  finished_at timestamp with time zone,
  status text CHECK (status IN ('success', 'failed')),
  created integer DEFAULT 0,
  updated integer DEFAULT 0,
  marked_deleted integer DEFAULT 0,
  source text CHECK (source IN ('manual', 'auto')) DEFAULT 'manual',
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create metricool_credentials table for storing API credentials
CREATE TABLE public.metricool_credentials (
  id serial PRIMARY KEY,
  access_token text NOT NULL,
  user_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  singleton_check boolean DEFAULT true UNIQUE -- ensures only one record
);

-- Enable RLS on all tables
ALTER TABLE public.metricool_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricool_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can access these tables
CREATE POLICY "Admins can view all metricool brands" 
ON public.metricool_brands 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert metricool brands" 
ON public.metricool_brands 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update metricool brands" 
ON public.metricool_brands 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete metricool brands" 
ON public.metricool_brands 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Admins can view all sync logs" 
ON public.metricool_sync_logs 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert sync logs" 
ON public.metricool_sync_logs 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can view credentials" 
ON public.metricool_credentials 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert credentials" 
ON public.metricool_credentials 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update credentials" 
ON public.metricool_credentials 
FOR UPDATE 
USING (is_admin_user());

-- Create trigger for updated_at on metricool_brands
CREATE TRIGGER update_metricool_brands_updated_at
BEFORE UPDATE ON public.metricool_brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on metricool_credentials
CREATE TRIGGER update_metricool_credentials_updated_at
BEFORE UPDATE ON public.metricool_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_metricool_brands_deleted_at ON public.metricool_brands(deleted_at);
CREATE INDEX idx_metricool_brands_last_synced_at ON public.metricool_brands(last_synced_at);
CREATE INDEX idx_metricool_sync_logs_created_at ON public.metricool_sync_logs(created_at);

-- Create function to clean up old deleted records (after 31 days)
CREATE OR REPLACE FUNCTION public.cleanup_deleted_metricool_brands()
RETURNS void AS $$
BEGIN
  DELETE FROM public.metricool_brands 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '31 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;