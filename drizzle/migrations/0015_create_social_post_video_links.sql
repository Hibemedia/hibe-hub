CREATE TABLE public.social_post_video_links (
  id uuid not null default gen_random_uuid() primary key,
  social_client_id text not null,
  post_date date not null,
  video_item_id uuid not null references public.video_items(id) on delete cascade,
  created_by uuid default auth.uid(),
  created_at timestamp with time zone not null default now(),
  unique (social_client_id, post_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_post_video_links TO authenticated;
GRANT ALL ON public.social_post_video_links TO service_role;
ALTER TABLE public.social_post_video_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage social video links" ON public.social_post_video_links FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));