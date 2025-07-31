-- Update existing brands without label to "Empty brand"
UPDATE public.metricool_brands 
SET label = 'Empty brand' 
WHERE label IS NULL OR label = '';