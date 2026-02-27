
CREATE OR REPLACE FUNCTION public.fuzzy_search_celestial(
  search_term text,
  similarity_threshold real DEFAULT 0.15
)
RETURNS SETOF celestial_objects
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM celestial_objects
  WHERE
    search_term = '' 
    OR catalog_id ILIKE '%' || search_term || '%'
    OR common_name ILIKE '%' || search_term || '%'
    OR similarity(catalog_id, search_term) > similarity_threshold
    OR similarity(COALESCE(common_name, ''), search_term) > similarity_threshold
  ORDER BY
    GREATEST(
      similarity(catalog_id, search_term),
      similarity(COALESCE(common_name, ''), search_term)
    ) DESC;
$$;
