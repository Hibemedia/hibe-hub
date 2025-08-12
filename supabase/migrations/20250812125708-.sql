-- Enable required extension for UUID generation
create extension if not exists pgcrypto with schema public;

-- 1) Social media accounts per Metricool brand
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id integer references public.metricool_brands(id) on delete cascade,
  platform text not null, -- 'facebook', 'instagram', 'tiktok', 'linkedin', 'youtube'
  account_name text,
  account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, platform)
);

alter table public.social_accounts enable row level security;

-- Admin full access policies
create policy if not exists "Admins can view social accounts"
  on public.social_accounts for select
  using (public.is_admin_user());

create policy if not exists "Admins can insert social accounts"
  on public.social_accounts for insert
  with check (public.is_admin_user());

create policy if not exists "Admins can update social accounts"
  on public.social_accounts for update
  using (public.is_admin_user());

create policy if not exists "Admins can delete social accounts"
  on public.social_accounts for delete
  using (public.is_admin_user());

-- Users can view their own brand's social accounts
create policy if not exists "Users can view their brand social accounts"
  on public.social_accounts for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.metricool_brand_id = social_accounts.brand_id
    )
  );

-- 2) Posts per Metricool brand
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  brand_id integer references public.metricool_brands(id) on delete cascade,
  platform text not null,
  post_id text not null, -- external platform post identifier
  posted_at timestamptz,
  content text,
  media_url text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, platform, post_id)
);

create index if not exists idx_posts_brand_platform_posted_at on public.posts(brand_id, platform, posted_at desc);

alter table public.posts enable row level security;

-- Admin policies
create policy if not exists "Admins can view posts"
  on public.posts for select
  using (public.is_admin_user());

create policy if not exists "Admins can insert posts"
  on public.posts for insert
  with check (public.is_admin_user());

create policy if not exists "Admins can update posts"
  on public.posts for update
  using (public.is_admin_user());

create policy if not exists "Admins can delete posts"
  on public.posts for delete
  using (public.is_admin_user());

-- Users can view posts for their brand
create policy if not exists "Users can view their brand posts"
  on public.posts for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.metricool_brand_id = posts.brand_id
    )
  );

-- 3) Daily metrics per post
create table if not exists public.post_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  date date not null,
  likes integer,
  comments integer,
  shares integer,
  views integer,
  impressions integer,
  reach integer,
  saves integer,
  clicks integer,
  engagement numeric,
  duration integer,
  full_video_watched_rate numeric,
  total_time_watched numeric,
  average_time_watched numeric,
  impression_sources jsonb,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, date)
);

create index if not exists idx_post_metrics_daily_post_date on public.post_metrics_daily(post_id, date);

alter table public.post_metrics_daily enable row level security;

-- Admin policies
create policy if not exists "Admins can view post metrics"
  on public.post_metrics_daily for select
  using (public.is_admin_user());

create policy if not exists "Admins can insert post metrics"
  on public.post_metrics_daily for insert
  with check (public.is_admin_user());

create policy if not exists "Admins can update post metrics"
  on public.post_metrics_daily for update
  using (public.is_admin_user());

create policy if not exists "Admins can delete post metrics"
  on public.post_metrics_daily for delete
  using (public.is_admin_user());

-- Users can view metrics for posts belonging to their brand
create policy if not exists "Users can view their brand post metrics"
  on public.post_metrics_daily for select
  using (
    exists (
      select 1 from public.posts p
      join public.users u on u.id = auth.uid()
      where p.id = post_metrics_daily.post_id and u.metricool_brand_id = p.brand_id
    )
  );

-- 4) Content sync logs (admin-only)
create table if not exists public.metricool_content_sync_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id integer,
  platform text,
  posts_fetched integer default 0,
  errors jsonb,
  raw_response jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.metricool_content_sync_logs enable row level security;

create policy if not exists "Admins can view content sync logs"
  on public.metricool_content_sync_logs for select
  using (public.is_admin_user());

create policy if not exists "Admins can insert content sync logs"
  on public.metricool_content_sync_logs for insert
  with check (public.is_admin_user());

-- 5) Update triggers for updated_at columns
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach triggers
create trigger trg_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger trg_post_metrics_daily_updated_at
before update on public.post_metrics_daily
for each row execute function public.set_updated_at();
