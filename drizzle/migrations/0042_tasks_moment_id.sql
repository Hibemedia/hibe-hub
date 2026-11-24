ALTER TABLE public.tasks ADD COLUMN moment_id uuid REFERENCES public.content_moments(id) ON DELETE SET NULL;
CREATE INDEX tasks_moment_id_idx ON public.tasks(moment_id) WHERE moment_id IS NOT NULL;