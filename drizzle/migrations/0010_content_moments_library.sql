CREATE TABLE public.content_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'shoot' CHECK (type IN ('shoot','post','evenement','actie','idee')),
  date date,
  start_time time,
  location text,
  script text,
  notes text,
  attendees text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'aangevraagd' CHECK (status IN ('aangevraagd','bevestigd','gepland','afgerond','geannuleerd')),
  requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_moments TO authenticated;
GRANT ALL ON public.content_moments TO service_role;
ALTER TABLE public.content_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage moments" ON public.content_moments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read own moments" ON public.content_moments FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());
CREATE POLICY "Clients request moments" ON public.content_moments FOR INSERT TO authenticated
  WITH CHECK (client_id = public.current_client_id() AND status = 'aangevraagd' AND requested_by = auth.uid());

CREATE TABLE public.content_moment_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.content_moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  text text NOT NULL CHECK (length(btrim(text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_moment_comments TO authenticated;
GRANT ALL ON public.content_moment_comments TO service_role;
ALTER TABLE public.content_moment_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read comments of visible moments" ON public.content_moment_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.content_moments m WHERE m.id = moment_id AND (m.client_id = public.current_client_id() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Write comments on visible moments" ON public.content_moment_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.content_moments m WHERE m.id = moment_id AND (m.client_id = public.current_client_id() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.library_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('logos','brandbook','fotos','videos','overig')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  description text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, category, file_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_files TO authenticated;
GRANT ALL ON public.library_files TO service_role;
ALTER TABLE public.library_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage library" ON public.library_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read own library" ON public.library_files FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());

CREATE POLICY "library admin all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'library' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'library' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "library client read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'library' AND (storage.foldername(name))[1] = public.current_client_id()::text);