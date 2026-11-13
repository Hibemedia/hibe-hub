ALTER POLICY "assignee creator or beheerder updates tasks" ON public.tasks
USING (public.has_role(auth.uid(), 'admin') AND (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_beheerder(auth.uid())))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
