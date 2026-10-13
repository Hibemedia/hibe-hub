CREATE TABLE public.profiles_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  notify_new_video boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles_settings TO authenticated;
GRANT ALL ON public.profiles_settings TO service_role;
ALTER TABLE public.profiles_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own settings read" ON public.profiles_settings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own settings insert" ON public.profiles_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own settings update" ON public.profiles_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin','client')) NOT VALID;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_uniq ON public.user_roles (user_id, role);

ALTER TABLE public.clients ADD COLUMN logo_url text;

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  mode text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','fout')),
  days_count integer,
  videos_count integer,
  error text
);
GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sync runs" ON public.sync_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX sync_runs_client_started ON public.sync_runs (client_id, started_at DESC);