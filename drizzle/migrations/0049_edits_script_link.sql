ALTER TABLE public.edits ADD COLUMN IF NOT EXISTS script_id uuid REFERENCES public.scripts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS edits_script_id_idx ON public.edits(script_id);