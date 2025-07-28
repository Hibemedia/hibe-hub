-- Remove old policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create new safe policies using the SECURITY DEFINER function
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