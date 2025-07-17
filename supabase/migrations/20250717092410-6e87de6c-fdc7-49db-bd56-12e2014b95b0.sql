-- Add role column to users table for role-based access
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'klant';

-- Update existing users to have admin role if needed
UPDATE public.users SET role = 'admin' WHERE email LIKE '%@hibe%' OR email LIKE '%admin%';

-- Create check constraint for valid roles
ALTER TABLE public.users 
ADD CONSTRAINT valid_user_role 
CHECK (role IN ('admin', 'manager', 'klant'));

-- Update the is_admin function to use the role column
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$function$;

-- Create is_manager function
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$function$;

-- Create is_client function (updated)
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'klant'
  );
$function$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;