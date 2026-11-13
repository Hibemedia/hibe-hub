DROP POLICY "own or beheerder inserts tasks" ON public.tasks;
CREATE POLICY "team inserts tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));