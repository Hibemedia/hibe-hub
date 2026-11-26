CREATE OR REPLACE FUNCTION public.edits_sync_social_links() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.video_item_id IS NOT NULL AND NEW.video_item_id IS DISTINCT FROM OLD.video_item_id THEN
    UPDATE public.social_post_video_links SET video_item_id = NEW.video_item_id, edit_id = NULL WHERE edit_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.social_resolve_edit_link() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE linked_video uuid;
BEGIN
 IF NEW.edit_id IS NOT NULL THEN
   SELECT video_item_id INTO linked_video FROM public.edits WHERE id = NEW.edit_id FOR SHARE;
   IF linked_video IS NOT NULL THEN NEW.video_item_id := linked_video; NEW.edit_id := NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER social_resolve_edit_link BEFORE INSERT OR UPDATE OF edit_id ON public.social_post_video_links FOR EACH ROW EXECUTE FUNCTION public.social_resolve_edit_link();