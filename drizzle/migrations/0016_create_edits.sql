CREATE TABLE public.edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  editor_id uuid,
  status text NOT NULL DEFAULT 'assign' CHECK (status IN ('assign','todo','editing','on_hold','delivered')),
  deadline date,
  notes text,
  video_item_id uuid REFERENCES public.video_items(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edits TO authenticated;
GRANT ALL ON public.edits TO service_role;
ALTER TABLE public.edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage edits" ON public.edits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX edits_client_idx ON public.edits(client_id);

ALTER TABLE public.hibe_notifications ADD COLUMN recipient_id uuid, ADD COLUMN edit_id uuid REFERENCES public.edits(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.edits_before() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.editor_id IS NOT NULL AND NEW.status = 'assign'
     AND (TG_OP = 'INSERT' OR OLD.editor_id IS DISTINCT FROM NEW.editor_id) THEN
    NEW.status := 'todo';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER edits_before BEFORE INSERT OR UPDATE ON public.edits FOR EACH ROW EXECUTE FUNCTION public.edits_before();

CREATE OR REPLACE FUNCTION public.edits_notify() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.editor_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.editor_id IS DISTINCT FROM NEW.editor_id)
     AND NEW.editor_id IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.hibe_notifications (client_id, kind, video_title, actor_id, recipient_id, edit_id)
    VALUES (NEW.client_id, 'edit_assigned', NEW.title, auth.uid(), NEW.editor_id, NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER edits_notify AFTER INSERT OR UPDATE ON public.edits FOR EACH ROW EXECUTE FUNCTION public.edits_notify();