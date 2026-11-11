ALTER TABLE public.content_moments ADD COLUMN show_crew_to_client boolean NOT NULL DEFAULT true;

CREATE TABLE public.moment_crew (
  moment_id uuid NOT NULL REFERENCES public.content_moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (moment_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moment_crew TO authenticated;
GRANT ALL ON public.moment_crew TO service_role;
ALTER TABLE public.moment_crew ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crew" ON public.moment_crew FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin') AND public.has_role(user_id,'admin'));

ALTER TABLE public.hibe_notifications ADD COLUMN moment_id uuid REFERENCES public.content_moments(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.moment_crew_notify() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.content_moments;
BEGIN
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    SELECT * INTO m FROM public.content_moments WHERE id = NEW.moment_id;
    INSERT INTO public.hibe_notifications (client_id, kind, video_title, actor_id, recipient_id, moment_id)
    VALUES (m.client_id, 'crew_assigned', m.title, auth.uid(), NEW.user_id, m.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER moment_crew_notify AFTER INSERT ON public.moment_crew FOR EACH ROW EXECUTE FUNCTION public.moment_crew_notify();

-- Clients see only first name + photo of the crew of their own moments, when allowed.
CREATE OR REPLACE FUNCTION public.client_moment_crew() RETURNS TABLE(moment_id uuid, first_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.moment_id, split_part(coalesce(nullif(u.full_name,''), split_part(u.email,'@',1)), ' ', 1), u.avatar_url
  FROM public.moment_crew c
  JOIN public.content_moments m ON m.id = c.moment_id
  JOIN public.users u ON u.id = c.user_id
  WHERE m.show_crew_to_client AND m.client_id = public.current_client_id()
$$;
REVOKE EXECUTE ON FUNCTION public.client_moment_crew() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.client_moment_crew() TO authenticated;