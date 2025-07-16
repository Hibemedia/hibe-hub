-- Fix RLS infinite recursion by creating security definer functions
-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Admins can insert feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Admins can manage metricool config" ON public.metricool_config;

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create security definer function to check if current user is client  
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'client'
  );
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view all videos" ON public.videos FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert videos" ON public.videos FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update videos" ON public.videos FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete videos" ON public.videos FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can view all feedback" ON public.video_feedback FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert feedback" ON public.video_feedback FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update feedback" ON public.video_feedback FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete feedback" ON public.video_feedback FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can manage metricool config" ON public.metricool_config FOR ALL USING (public.is_admin());