-- Eerst maken we de SECURITY DEFINER functie
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Nu verwijderen we alle oude policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- En maken nieuwe veilige policies
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
USING (public.is_admin_user());

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (public.is_admin_user());