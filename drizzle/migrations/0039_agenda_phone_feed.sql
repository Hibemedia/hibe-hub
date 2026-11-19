CREATE TABLE public.agenda_feeds (
  user_id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE,
  scope text NOT NULL DEFAULT 'me' CHECK (scope IN ('me','team')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.agenda_feeds IS 'Persoonlijke iCal-adressen waarmee een HIBE-beheerder zijn agenda op zijn telefoon bekijkt.';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_feeds TO authenticated;
GRANT ALL ON public.agenda_feeds TO service_role;
ALTER TABLE public.agenda_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigen agenda-koppeling lezen" ON public.agenda_feeds FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Beheerders maken hun eigen agenda-koppeling" ON public.agenda_feeds FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Beheerders wijzigen hun eigen agenda-koppeling" ON public.agenda_feeds FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (scope = 'me' OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Beheerders verwijderen hun eigen agenda-koppeling" ON public.agenda_feeds FOR DELETE TO authenticated USING (user_id = auth.uid());