CREATE TABLE public.hibe_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.video_items(id) ON DELETE CASCADE,
  kind text NOT NULL,
  video_title text NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
GRANT SELECT, UPDATE ON public.hibe_notifications TO authenticated;
GRANT ALL ON public.hibe_notifications TO service_role;
ALTER TABLE public.hibe_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notifications" ON public.hibe_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins mark notifications read" ON public.hibe_notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX hibe_notifications_created ON public.hibe_notifications (created_at DESC);

CREATE OR REPLACE FUNCTION public.video_client_action(_item_id uuid, _action text)
 RETURNS video_items LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.video_items; vid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd'; END IF;
  SELECT * INTO r FROM public.video_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND OR r.client_id IS DISTINCT FROM public.current_client_id() THEN RAISE EXCEPTION 'Video niet gevonden'; END IF;
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