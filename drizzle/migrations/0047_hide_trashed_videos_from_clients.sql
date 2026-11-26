DROP POLICY IF EXISTS "Clients read own visible video items" ON public.video_items;
CREATE POLICY "Clients read own visible video items" ON public.video_items FOR SELECT TO authenticated
USING (client_id = public.current_client_id() AND trashed_at IS NULL AND status = ANY (ARRAY['client_review','approved_client','scheduled','archived']));

CREATE OR REPLACE FUNCTION public.video_client_visible(_item_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.video_items v WHERE v.id = _item_id
    AND v.client_id = public.current_client_id() AND v.trashed_at IS NULL
    AND v.status IN ('client_review','approved_client','scheduled','archived'))
$$;

CREATE OR REPLACE FUNCTION public.video_client_action(_item_id uuid, _action text)
 RETURNS video_items LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.video_items; vid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd'; END IF;
  SELECT * INTO r FROM public.video_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND OR r.client_id IS DISTINCT FROM public.current_client_id() OR r.trashed_at IS NOT NULL THEN RAISE EXCEPTION 'Video niet gevonden'; END IF;
  IF r.status <> 'client_review' THEN RAISE EXCEPTION 'Deze video staat niet ter controle'; END IF;
  IF _action = 'approve' THEN
    UPDATE public.video_items SET status = 'approved_client' WHERE id = _item_id RETURNING * INTO r;
    INSERT INTO public.hibe_notifications (client_id, item_id, kind, video_title, actor_id) VALUES (r.client_id, r.id, 'client_approved', r.title, auth.uid());
  ELSIF _action = 'feedback' THEN
    SELECT id INTO vid FROM public.video_versions WHERE item_id = _item_id AND version = r.current_version;
    IF NOT EXISTS (SELECT 1 FROM public.video_comments WHERE version_id = vid AND internal = false AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Plaats eerst minstens één opmerking';
    END IF;
    UPDATE public.video_items SET status = 'feedback' WHERE id = _item_id RETURNING * INTO r;
    INSERT INTO public.hibe_notifications (client_id, item_id, kind, video_title, actor_id) VALUES (r.client_id, r.id, 'client_feedback', r.title, auth.uid());
  ELSE
    RAISE EXCEPTION 'Onbekende actie';
  END IF;
  RETURN r;
END $function$;