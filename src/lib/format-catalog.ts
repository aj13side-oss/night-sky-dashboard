/**
 * Format a celestial object's catalog identifier.
 * If scientific_notation exists, returns "catalog_id/scientific_notation".
 */
export function formatCatalogId(obj: { catalog_id: string; scientific_notation?: string | null }): string {
  return obj.scientific_notation
    ? `${obj.catalog_id}/${obj.scientific_notation}`
    : obj.catalog_id;
}
