ALTER TABLE public.social_post_video_links ALTER COLUMN video_item_id DROP NOT NULL;
ALTER TABLE public.social_post_video_links ADD COLUMN IF NOT EXISTS edit_id uuid REFERENCES public.edits(id) ON DELETE CASCADE;
ALTER TABLE public.social_post_video_links ADD CONSTRAINT social_link_target CHECK (video_item_id IS NOT NULL OR edit_id IS NOT NULL);
CREATE OR REPLACE FUNCTION public.edits_sync_social_links() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.video_item_id IS NOT NULL AND NEW.video_item_id IS DISTINCT FROM OLD.video_item_id THEN
    UPDATE public.social_post_video_links SET video_item_id = NEW.video_item_id WHERE edit_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS edits_sync_social_links ON public.edits;
CREATE TRIGGER edits_sync_social_links AFTER UPDATE OF video_item_id ON public.edits FOR EACH ROW EXECUTE FUNCTION public.edits_sync_social_links();