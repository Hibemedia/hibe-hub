-- Add include_posts flag to control whether post/metrics are included in auto-sync
alter table public.metricool_sync_schedule
  add column if not exists include_posts boolean not null default true;