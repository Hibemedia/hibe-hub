-- Fix the missing trigger for automatic user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert test admin user (lars@hibemedia.com)
-- First we need to insert into auth.users manually since we can't use the signup flow
-- This is a special case for creating admin users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'lars@hibemedia.com',
  crypt('Hakkelvak-2A', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- The trigger should automatically create the corresponding public.users record
-- But let's also manually ensure the admin role is set correctly
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'lars@hibemedia.com';