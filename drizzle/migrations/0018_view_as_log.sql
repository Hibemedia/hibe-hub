CREATE TABLE public.view_as_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.view_as_log TO authenticated;
GRANT ALL ON public.view_as_log TO service_role;
ALTER TABLE public.view_as_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read view-as log" ON public.view_as_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.start_view_as(_client uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Alleen HIBE-accounts kunnen meekijken'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = _client) THEN RAISE EXCEPTION 'Klant niet gevonden'; END IF;
  INSERT INTO public.view_as_log (admin_id, client_id) VALUES (auth.uid(), _client) RETURNING id INTO lid;
  RETURN lid;
END $$;
REVOKE EXECUTE ON FUNCTION public.start_view_as(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.start_view_as(uuid) TO authenticated;