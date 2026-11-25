ALTER TABLE public.team_roles DROP CONSTRAINT team_roles_role_check;
ALTER TABLE public.team_roles ADD CONSTRAINT team_roles_role_check CHECK (role IN ('beheerder','editor','accountmanager'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
CREATE OR REPLACE FUNCTION public.touch_user_activity() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
UPDATE public.users SET last_active_at = now() WHERE id = auth.uid() AND (last_active_at IS NULL OR last_active_at < now() - interval '5 minutes');
$$;
REVOKE ALL ON FUNCTION public.touch_user_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_user_activity() TO authenticated;
COMMENT ON COLUMN public.users.last_active_at IS 'Last authenticated app use, updated server-side at most once per five minutes.';