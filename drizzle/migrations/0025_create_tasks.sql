CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  notes text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  assignee_id uuid NOT NULL,
  due_date date,
  due_time time,
  done_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team reads tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own or beheerder inserts tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND (assignee_id = auth.uid() OR public.is_beheerder(auth.uid())));
CREATE POLICY "assignee creator or beheerder updates tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_beheerder(auth.uid())))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_beheerder(auth.uid())));
CREATE POLICY "creator or beheerder deletes tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_beheerder(auth.uid())));
CREATE INDEX tasks_assignee_idx ON public.tasks(assignee_id, due_date);