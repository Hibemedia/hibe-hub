CREATE TABLE public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  caption text,
  planned_date timestamptz,
  networks text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','changes_requested')),
  source text NOT NULL DEFAULT 'hibe' CHECK (source IN ('hibe','metricool')),
  storage_path text,
  external_link text,
  metricool_post_id text,
  metricool_post_uuid text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, metricool_post_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_items TO authenticated;
GRANT ALL ON public.review_items TO service_role;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own client review items" ON public.review_items FOR SELECT TO authenticated
  USING (client_id = public.current_client_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage review items" ON public.review_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_item_id uuid NOT NULL REFERENCES public.review_items(id) ON DELETE CASCADE,
  action text NOT NULL,
  note text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_events TO authenticated;
GRANT ALL ON public.review_events TO service_role;
ALTER TABLE public.review_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read events of visible items" ON public.review_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.review_items r WHERE r.id = review_item_id
    AND (r.client_id = public.current_client_id() OR public.has_role(auth.uid(),'admin'))));

-- All status changes go through this function so every action is logged.
CREATE OR REPLACE FUNCTION public.review_action(_item_id uuid, _action text, _note text DEFAULT NULL, _storage_path text DEFAULT NULL)
RETURNS public.review_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.review_items; is_admin boolean := public.has_role(auth.uid(),'admin');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd'; END IF;
  SELECT * INTO r FROM public.review_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND OR NOT (is_admin OR r.client_id = public.current_client_id()) THEN RAISE EXCEPTION 'Item niet gevonden'; END IF;
  IF _action IN ('approved','rejected','changes_requested') THEN
    IF r.status <> 'pending' THEN RAISE EXCEPTION 'Dit item is al beoordeeld'; END IF;
    IF _action <> 'approved' AND coalesce(btrim(_note),'') = '' THEN RAISE EXCEPTION 'Opmerking is verplicht'; END IF;
    UPDATE public.review_items SET status = _action WHERE id = _item_id RETURNING * INTO r;
  ELSIF _action = 'new_version' THEN
    IF NOT is_admin THEN RAISE EXCEPTION 'Alleen HIBE kan een nieuwe versie plaatsen'; END IF;
    IF r.status <> 'changes_requested' THEN RAISE EXCEPTION 'Alleen bij een wijzigingsverzoek'; END IF;
    UPDATE public.review_items SET status = 'pending', storage_path = coalesce(_storage_path, storage_path) WHERE id = _item_id RETURNING * INTO r;
  ELSE
    RAISE EXCEPTION 'Onbekende actie';
  END IF;
  INSERT INTO public.review_events (review_item_id, action, note, user_id) VALUES (_item_id, _action, nullif(btrim(_note),''), auth.uid());
  RETURN r;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_action(uuid,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_action(uuid,text,text,text) TO authenticated;

-- Log creation automatically
CREATE OR REPLACE FUNCTION public.review_item_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.review_events (review_item_id, action, user_id) VALUES (NEW.id, 'created', NEW.created_by);
  RETURN NEW;
END $$;
CREATE TRIGGER review_item_created AFTER INSERT ON public.review_items FOR EACH ROW EXECUTE FUNCTION public.review_item_created();

-- Storage: first folder = client id
CREATE POLICY "Read review media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'review-media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = public.current_client_id()::text));
CREATE POLICY "Admins upload review media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update review media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'review-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete review media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Read thumbnails" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'thumbnails' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = public.current_client_id()::text));