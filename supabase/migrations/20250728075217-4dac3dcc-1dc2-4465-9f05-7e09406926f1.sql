-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'klant')::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;