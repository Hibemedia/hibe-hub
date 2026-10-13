-- When a client is linked to another Metricool brand, old numbers belong to the old brand: remove them.
CREATE OR REPLACE FUNCTION public.clients_brand_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.metricool_blog_id IS DISTINCT FROM OLD.metricool_blog_id THEN
    DELETE FROM public.daily_stats WHERE client_id = NEW.id;
    DELETE FROM public.videos WHERE client_id = NEW.id;
    DELETE FROM public.review_items WHERE client_id = NEW.id AND source = 'metricool';
    NEW.metricool_brand_label := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER clients_brand_changed BEFORE UPDATE OF metricool_blog_id ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.clients_brand_changed();