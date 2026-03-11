import { CelestialObject } from "@/hooks/useCelestialObjects";

export interface SearchContext {
  description: string;
  image: string | null;
}

export function getSearchContext(
  obj: CelestialObject,
  searchQuery: string
): SearchContext | null {
  if (!searchQuery.trim()) return null;
  const query = searchQuery.trim().toLowerCase();

  // Direct match on catalog_id, common_name, or scientific_notation → no context
  if (obj.catalog_id.toLowerCase().includes(query)) return null;
  if (obj.common_name?.toLowerCase().includes(query)) return null;
  if (obj.scientific_notation?.toLowerCase().includes(query)) return null;

  // Check alias_details (richest context)
  if (obj.alias_details) {
    for (const [alias, detail] of Object.entries(obj.alias_details)) {
      if (alias.toLowerCase().includes(query)) {
        return {
          description: detail.desc,
          image: detail.img || null,
        };
      }
    }
  }

  // Check search_aliases (generic context)
  if (obj.search_aliases) {
    const aliases = obj.search_aliases.split(",").map((a) => a.trim());
    const matched = aliases.find((a) => a.toLowerCase().includes(query));
    if (matched) {
      return {
        description: `Also known as "${matched}"`,
        image: null,
      };
    }
  }

  return null;
}
