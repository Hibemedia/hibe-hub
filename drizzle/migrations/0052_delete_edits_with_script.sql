CREATE OR REPLACE FUNCTION public.scripts_delete_edits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  DELETE FROM public.edits WHERE script_id = OLD.id AND status <> 'delivered';
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS scripts_delete_edits ON public.scripts;
CREATE TRIGGER scripts_delete_edits BEFORE DELETE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.scripts_delete_edits();