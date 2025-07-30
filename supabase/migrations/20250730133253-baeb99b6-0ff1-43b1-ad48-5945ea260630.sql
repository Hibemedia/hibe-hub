-- Fix function search path mutable warnings by setting search_path
CREATE OR REPLACE FUNCTION public.cleanup_deleted_metricool_brands()
RETURNS void AS $$
BEGIN
  DELETE FROM public.metricool_brands 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '31 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Also fix the existing function that had the same issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;