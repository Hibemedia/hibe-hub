CREATE TABLE public.video_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'internal_review' CHECK (status IN ('internal_review','feedback','approved_internal','ready_for_client','client_review','approved_client','scheduled','archived')),
  current_version integer NOT NULL DEFAULT 0,
  drive_link text,
  archived_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status_changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_items_client_idx ON public.video_items(client_id, status);

CREATE TABLE public.video_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.video_items(id) ON DELETE CASCADE,
  version integer NOT NULL,
  r2_key text NOT NULL,
  file_name text NOT NULL,
  size_bytes bigint,
  mime_type text,
  upload_status text NOT NULL DEFAULT 'uploading' CHECK (upload_status IN ('uploading','ready')),
  upload_id text,
  uploaded_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, version)
);

CREATE TABLE public.video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.video_items(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.video_versions(id) ON DELETE CASCADE,
  number integer NOT NULL DEFAULT 0,
  time_seconds numeric(10,2) NOT NULL DEFAULT 0 CHECK (time_seconds >= 0),
  text text NOT NULL CHECK (length(btrim(text)) > 0 AND length(text) <= 4000),
  internal boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_comments_version_idx ON public.video_comments(version_id, time_seconds);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_comments TO authenticated;
GRANT ALL ON public.video_items, public.video_versions, public.video_comments TO service_role;

ALTER TABLE public.video_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.video_client_visible(_item_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.video_items v WHERE v.id = _item_id
    AND v.client_id = public.current_client_id()
    AND v.status IN ('client_review','approved_client','scheduled','archived'))
$$;

CREATE POLICY "Admins manage video items" ON public.video_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read own visible video items" ON public.video_items FOR SELECT TO authenticated
  USING (client_id = public.current_client_id() AND status IN ('client_review','approved_client','scheduled','archived'));

CREATE POLICY "Admins manage video versions" ON public.video_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read visible versions" ON public.video_versions FOR SELECT TO authenticated
  USING (upload_status = 'ready' AND public.video_client_visible(item_id));

CREATE POLICY "Admins manage video comments" ON public.video_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read non-internal comments" ON public.video_comments FOR SELECT TO authenticated
  USING (internal = false AND public.video_client_visible(item_id));
CREATE POLICY "Clients comment during review" ON public.video_comments FOR INSERT TO authenticated
  WITH CHECK (internal = false AND resolved = false AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.video_items v WHERE v.id = item_id AND v.client_id = public.current_client_id() AND v.status = 'client_review'));

CREATE OR REPLACE FUNCTION public.video_comment_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT item_id FROM public.video_versions WHERE id = NEW.version_id) IS DISTINCT FROM NEW.item_id THEN
    RAISE EXCEPTION 'Versie hoort niet bij deze video';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.version_id::text));
  SELECT coalesce(max(number),0) + 1 INTO NEW.number FROM public.video_comments WHERE version_id = NEW.version_id;
  RETURN NEW;
END $$;
CREATE TRIGGER video_comment_number BEFORE INSERT ON public.video_comments FOR EACH ROW EXECUTE FUNCTION public.video_comment_number();

CREATE OR REPLACE FUNCTION public.video_status_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN NEW.archived_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER video_status_touch BEFORE UPDATE ON public.video_items FOR EACH ROW EXECUTE FUNCTION public.video_status_touch();

CREATE OR REPLACE FUNCTION public.video_client_action(_item_id uuid, _action text)
RETURNS public.video_items LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.video_items; vid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd'; END IF;
  SELECT * INTO r FROM public.video_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND OR r.client_id IS DISTINCT FROM public.current_client_id() THEN RAISE EXCEPTION 'Video niet gevonden'; END IF;
  IF r.status <> 'client_review' THEN RAISE EXCEPTION 'Deze video staat niet ter controle'; END IF;
  IF _action = 'approve' THEN
    UPDATE public.video_items SET status = 'approved_client' WHERE id = _item_id RETURNING * INTO r;
  ELSIF _action = 'feedback' THEN
    SELECT id INTO vid FROM public.video_versions WHERE item_id = _item_id AND version = r.current_version;
    IF NOT EXISTS (SELECT 1 FROM public.video_comments WHERE version_id = vid AND internal = false AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Plaats eerst minstens één opmerking';
    END IF;
    UPDATE public.video_items SET status = 'feedback' WHERE id = _item_id RETURNING * INTO r;
  ELSE
    RAISE EXCEPTION 'Onbekende actie';
  END IF;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.video_client_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_client_visible(uuid) TO authenticated;