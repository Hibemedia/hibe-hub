-- Create admin user with email: admin@example.com, password: admin123
INSERT INTO public.users (id, email, password_hash, role) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$zQjQVzJzJzJzJzJzJzJzJuKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  'admin'
);

-- Create profile for admin user
INSERT INTO public.profiles (user_id, full_name) VALUES (
  (SELECT id FROM public.users WHERE email = 'admin@example.com'),
  'Admin User'
);