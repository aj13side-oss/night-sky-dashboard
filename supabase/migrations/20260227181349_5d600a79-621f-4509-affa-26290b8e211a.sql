
-- GIN trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_celestial_catalog_trgm ON celestial_objects USING gin (catalog_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_celestial_common_name_trgm ON celestial_objects USING gin (common_name gin_trgm_ops);

-- Fuzzy search function using similarity
CREATE OR REPLACE FUNCTION public.fuzzy_search_celestial(
  search_term text,
  similarity_threshold real DEFAULT 0.15
)
RETURNS SETOF celestial_objects
LANGUAGE sql
STABLE
SECURITY DEFINER
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
