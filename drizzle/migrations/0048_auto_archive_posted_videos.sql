CREATE OR REPLACE FUNCTION public.archive_posted_videos()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer := 0; r record;
BEGIN
  FOR r IN SELECT v.id, v.status_changed_at FROM public.video_items v
    WHERE v.status = 'scheduled' AND v.trashed_at IS NULL
      AND EXISTS (SELECT 1 FROM public.social_post_video_links l WHERE l.video_item_id = v.id
                  AND l.post_date < (now() AT TIME ZONE 'Europe/Amsterdam')::date)
  LOOP
    UPDATE public.video_items SET status = 'archived' WHERE id = r.id;
    UPDATE public.video_items SET status_changed_at = r.status_changed_at WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.archive_posted_videos() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('archive-posted-videos', '5 0 * * *', 'SELECT public.archive_posted_videos()');
SELECT public.archive_posted_videos();