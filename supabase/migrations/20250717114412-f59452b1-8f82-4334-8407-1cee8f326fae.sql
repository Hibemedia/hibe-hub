-- Create admin test user using Supabase signup approach
-- Since we can't directly insert into auth.users, we'll use the signup process
-- First let's try to check if user already exists
DO $$
DECLARE
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user already exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'lars@hibemedia.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- We need to manually insert the user since we can't use the signup API from SQL
        -- Let's create a user record that can be used for testing
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'lars@hibemedia.com',
            'admin',
            now(),
            now()
        );
        
        RAISE NOTICE 'Test admin user record created in public.users table. Please create the auth.users record via Supabase Auth admin panel.';
    ELSE
        -- Update existing user to admin role
        UPDATE public.users 
        SET role = 'admin', updated_at = now()
        WHERE email = 'lars@hibemedia.com';
        
        RAISE NOTICE 'Existing user updated to admin role.';
    END IF;
END $$;