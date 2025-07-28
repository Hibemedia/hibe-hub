-- Drop all Metricool-related tables and their dependencies

-- Drop metricool_brands table (includes all policies, triggers, constraints)
DROP TABLE IF EXISTS public.metricool_brands CASCADE;

-- Drop metricool_credentials table (includes all policies, triggers, constraints)  
DROP TABLE IF EXISTS public.metricool_credentials CASCADE;