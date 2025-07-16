-- First, remove the invalid user record
DELETE FROM public.users WHERE email = 'admin@example.com';
DELETE FROM public.profiles WHERE user_id = (SELECT id FROM public.users WHERE email = 'admin@example.com');

-- Create admin user in auth.users table using Supabase's signup function
-- This will create the user with proper password hashing
SELECT auth.signup('admin@example.com', 'admin123', '{"role": "admin"}');

-- Create corresponding entries in our custom tables
-- We'll use a function to ensure the user gets created properly
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
  
  -- Insert into our custom users table
  INSERT INTO public.users (id, email, password_hash, role) VALUES (
    admin_user_id,
    'admin@example.com',
    'managed_by_supabase_auth',
    'admin'
  ) ON CONFLICT (id) DO UPDATE SET role = 'admin';
  
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name) VALUES (
    admin_user_id,
    'Admin User'
  ) ON CONFLICT (user_id) DO UPDATE SET full_name = 'Admin User';
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Clean up the function
DROP FUNCTION create_admin_user();