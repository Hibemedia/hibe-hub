CREATE TABLE public.team_roles (
  user_id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('beheerder','editor')),
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_roles TO authenticated;
GRANT ALL ON public.team_roles TO service_role;
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_beheerder(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') AND EXISTS (SELECT 1 FROM public.team_roles WHERE user_id = _user_id AND role = 'beheerder')
$$;

CREATE POLICY "admins read team roles" ON public.team_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "beheerders insert team roles" ON public.team_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_beheerder(auth.uid()) AND public.has_role(user_id,'admin'));
CREATE POLICY "beheerders update team roles" ON public.team_roles FOR UPDATE TO authenticated
  USING (public.is_beheerder(auth.uid())) WITH CHECK (public.is_beheerder(auth.uid()));
CREATE POLICY "beheerders delete team roles" ON public.team_roles FOR DELETE TO authenticated
  USING (public.is_beheerder(auth.uid()));