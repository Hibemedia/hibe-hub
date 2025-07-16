-- Remove duplicate entries, keeping only the most recent one per blog_id
DELETE FROM metricool_config 
WHERE id NOT IN (
  SELECT DISTINCT ON (blog_id) id 
  FROM metricool_config 
  ORDER BY blog_id, created_at DESC
);