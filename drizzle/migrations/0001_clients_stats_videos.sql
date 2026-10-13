CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metricool_blog_id text UNIQUE,
  tiktok_handle text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT client_id FROM public.users WHERE id = auth.uid() $$;

CREATE POLICY "Users view own client" ON public.clients FOR SELECT TO authenticated
  USING (id = public.current_client_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage clients" ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.clients TO authenticated;

CREATE TABLE public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  network text NOT NULL CHECK (network IN ('ig','tt','yt','fb')),
  date date NOT NULL,
  followers integer,
  reach bigint,
  views bigint,
  interactions bigint,
  posts integer,
  followers_gained integer,
  followers_lost integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, network, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_stats TO authenticated;
GRANT ALL ON public.daily_stats TO service_role;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own client stats" ON public.daily_stats FOR SELECT TO authenticated
  USING (client_id = public.current_client_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write stats" ON public.daily_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  network text NOT NULL CHECK (network IN ('ig','tt','yt','fb')),
  external_id text NOT NULL,
  published_at timestamptz,
  title text,
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  saves bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own client videos" ON public.videos FOR SELECT TO authenticated
  USING (client_id = public.current_client_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write videos" ON public.videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX daily_stats_client_date ON public.daily_stats (client_id, date);
CREATE INDEX videos_client_pub ON public.videos (client_id, published_at);