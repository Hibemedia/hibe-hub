ALTER TABLE public.users ADD COLUMN first_name text, ADD COLUMN last_name text, ADD COLUMN job_title text;

-- Display info (no e-mail) for avatars: HIBE team for everyone signed in, plus own client's users.
CREATE OR REPLACE FUNCTION public.visible_profiles()
RETURNS TABLE(id uuid, name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, coalesce(nullif(btrim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')),''), nullif(u.full_name,''), split_part(u.email,'@',1)), u.avatar_url
  FROM public.users u
  WHERE auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(),'admin') OR u.id = auth.uid() OR public.has_role(u.id,'admin')
    OR (u.client_id IS NOT NULL AND u.client_id = public.current_client_id()))
$$;
REVOKE EXECUTE ON FUNCTION public.visible_profiles() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.visible_profiles() TO authenticated;