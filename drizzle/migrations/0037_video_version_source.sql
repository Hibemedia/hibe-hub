alter table public.video_versions
  add column if not exists source text not null default 'upload';

comment on column public.video_versions.source is 'upload = gewone upload, capcut = definitieve versie uit CapCut (met ondertiteling)';

update public.video_versions v
   set source = 'capcut'
  from public.video_items i
 where v.item_id = i.id
   and v.version = i.current_version
   and i.current_version > 1
   and i.status in ('client_review', 'approved_client', 'scheduled');