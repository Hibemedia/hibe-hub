-- Fix JeBroer client_id to match blog_id for consistency
UPDATE metricool_config 
SET client_id = '3400972' 
WHERE blog_id = 3400972 AND brand_name = 'jebroerforlife';