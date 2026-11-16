ALTER TABLE public.video_items ADD COLUMN editor_id uuid;
COMMENT ON COLUMN public.video_items.editor_id IS 'Responsible HIBE team member for processing video feedback.';
UPDATE public.video_items v SET editor_id = e.editor_id FROM (SELECT DISTINCT ON (video_item_id) video_item_id, editor_id FROM public.edits WHERE video_item_id IS NOT NULL AND editor_id IS NOT NULL ORDER BY video_item_id, updated_at DESC, id) e WHERE v.id = e.video_item_id;
CREATE OR REPLACE FUNCTION public.set_video_feedback_editor(_item_id uuid, _editor_id uuid)
RETURNS public.video_items LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.video_items;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Alleen HIBE kan een editor kiezen'; END IF;
  IF _editor_id IS NOT NULL AND NOT public.has_role(_editor_id, 'admin') THEN RAISE EXCEPTION 'Kies een HIBE-teamlid'; END IF;
  UPDATE public.video_items SET editor_id = _editor_id WHERE id = _item_id RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Video niet gevonden'; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.set_video_feedback_editor(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_video_feedback_editor(uuid, uuid) TO authenticated, service_role;