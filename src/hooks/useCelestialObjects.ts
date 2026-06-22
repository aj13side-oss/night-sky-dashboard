import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface CelestialObject {
  id: string;
  catalog_id: string;
  common_name: string | null;
  obj_type: string;
  constellation: string | null;
  ra: number | null;
  dec: number | null;
  ra_deg: number | null;
  ra_hours: number | null;
  dec_deg: number | null;
  dec_hours: number | null;
  magnitude: number | null;
  surf_brightness: number | null;
  size_max: number | null;
  photo_score: number | null;
  exposure_guide_fast: number | null;
  exposure_guide_deep: number | null;
  best_months: string | null;
  recommended_filter: string | null;
  moon_tolerance: number | null;
  ideal_resolution: string | null;
  image_search_query: string | null;
  forced_image_url: string | null;
  scientific_notation: string | null;
  parent_id: string | null;
  relation_note: string | null;
  search_aliases: string | null;
  seo_description: string | null;
  alias_details: Record<string, { desc: string; img?: string | null }> | null;
}

export type CatalogFilter = "" | "M" | "NGC" | "IC" | "SH" | "B" | "ACO" | "C" | "OTHER";

export async function fetchCatalogObjectIds(catalog: Exclude<CatalogFilter, "">): Promise<string[]> {
  const ids: string[] = [];
  const PAGE = 1000;
  let from = 0;
  while (from < 50000) {
    const { data, error } = await supabase
      .from("object_catalogs" as any)
      .select("object_id")
      .eq("catalog", catalog)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as any[]) {
      if (r.object_id) ids.push(r.object_id as string);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return ids;
}


export interface CelestialFilters {
  search: string;
  objTypes: string[];
  excludeTypes: string[];
  constellation: string;
  maxMagnitude: number;
  minPhotoScore: number;
  sortBy: "photo_score" | "magnitude" | "size_max" | "catalog_id" | "tonight_best";
  minSize: number;
  maxSize: number;
  limitResults?: number;
  catalog: CatalogFilter;
}


const PAGE_SIZE = 30;

async function fetchObjects(filters: CelestialFilters, page: number) {
  const effectivePageSize = filters.limitResults && filters.limitResults < PAGE_SIZE ? filters.limitResults : PAGE_SIZE;
  const from = page * effectivePageSize;

  // Resolve catalog membership via the object_catalogs link table.
  let catalogIds: string[] | null = null;
  if (filters.catalog) {
    catalogIds = await fetchCatalogObjectIds(filters.catalog);
    if (catalogIds.length === 0) {
      return { data: [] as CelestialObject[], count: 0 };
    }
  }


  // Use fuzzy search RPC when there's a search term
  if (filters.search.trim()) {
    const term = filters.search.trim();
    let results: CelestialObject[] = [];

    // Try fuzzy RPC first, fall back to ilike if unavailable
    const { data: fuzzyData, error: fuzzyError } = await supabase
      .rpc("fuzzy_search_celestial", { search_term: term, similarity_threshold: 0.15 });

    if (!fuzzyError && fuzzyData) {
      results = fuzzyData as CelestialObject[];
    } else {
      // Fallback: standard ilike search across catalog_id, common_name, scientific_notation
      const { data: fallbackData } = await supabase
        .from("celestial_objects")
        .select("*")
        .or(`catalog_id.ilike.%${term}%,common_name.ilike.%${term}%,scientific_notation.ilike.%${term}%,search_aliases.ilike.%${term}%,relation_note.ilike.%${term}%`)
        .order("photo_score", { ascending: false, nullsFirst: false })
        .limit(200);
      results = (fallbackData ?? []) as CelestialObject[];
    }

    // Also search scientific_notation if not already covered
    const termLower = term.toLowerCase();
    if (!results.some(r => r.scientific_notation?.toLowerCase().includes(termLower) || r.catalog_id?.toLowerCase().includes(termLower))) {
      const { data: sciData } = await supabase
        .from("celestial_objects")
        .select("*")
        .ilike("scientific_notation", `%${term}%`)
        .limit(50);
      if (sciData && sciData.length > 0) {
        const existingIds = new Set(results.map(r => r.id));
        const newItems = (sciData as CelestialObject[]).filter(r => !existingIds.has(r.id));
        results = [...newItems, ...results];
      }
    }

    // Apply client-side filters on fuzzy results
    if (catalogIds) {
      const idSet = new Set(catalogIds);
      results = results.filter((o) => idSet.has(o.id));
    }
    if (filters.objTypes.length > 0) {
      results = results.filter((o) => filters.objTypes.includes(o.obj_type));
    }

    if (filters.constellation) {
      results = results.filter((o) => o.constellation === filters.constellation);
    }
    if (filters.maxMagnitude < 20) {
      results = results.filter((o) => o.magnitude != null && o.magnitude <= filters.maxMagnitude);
    }
    if (filters.minPhotoScore > 0) {
      results = results.filter((o) => o.photo_score != null && o.photo_score >= filters.minPhotoScore);
    }
    if (filters.minSize > 0) {
      results = results.filter((o) => o.size_max != null && o.size_max >= filters.minSize);
    }
    if (filters.maxSize < 300) {
      results = results.filter((o) => o.size_max != null && o.size_max <= filters.maxSize);
    }

    const totalCount = filters.limitResults ? Math.min(results.length, filters.limitResults) : results.length;
    const maxEnd = filters.limitResults ? Math.min(from + effectivePageSize, filters.limitResults) : from + effectivePageSize;
    const paged = results.slice(from, maxEnd);

    return { data: paged, count: totalCount };
  }

  // Standard query without search
  let query = supabase
    .from("celestial_objects")
    .select("*", { count: "exact" });

  if (filters.objTypes.length > 0) {
    query = query.in("obj_type", filters.objTypes);
  } else if (filters.excludeTypes.length > 0) {
    for (const t of filters.excludeTypes) {
      query = query.neq("obj_type", t);
    }
  }

  if (catalogIds) {
    query = query.in("id", catalogIds);
  }



  if (filters.constellation) {
    query = query.eq("constellation", filters.constellation);
  }

  if (filters.maxMagnitude < 20) {
    query = query.lte("magnitude", filters.maxMagnitude);
  }

  if (filters.minPhotoScore > 0) {
    query = query.gte("photo_score", filters.minPhotoScore);
  }

  if (filters.minSize > 0) {
    query = query.gte("size_max", filters.minSize);
  }
  if (filters.maxSize < 300) {
    query = query.lte("size_max", filters.maxSize);
  }

  switch (filters.sortBy) {
    case "photo_score":
    case "tonight_best":
      query = query.order("photo_score", { ascending: false, nullsFirst: false });
      break;
    case "magnitude":
      query = query.order("magnitude", { ascending: true, nullsFirst: false });
      break;
    case "size_max":
      query = query.order("size_max", { ascending: false, nullsFirst: false });
      break;
    case "catalog_id":
      query = query.order("catalog_id", { ascending: true });
      break;
  }

  const maxEnd = filters.limitResults ? Math.min(from + effectivePageSize - 1, filters.limitResults - 1) : from + effectivePageSize - 1;
  if (filters.limitResults && from >= filters.limitResults) {
    return { data: [] as CelestialObject[], count: 0 };
  }
  query = query.range(from, maxEnd);

  const { data, error, count } = await query;
  if (error) throw error;
  const totalCount = filters.limitResults ? Math.min(count ?? 0, filters.limitResults) : (count ?? 0);
  return { data: data as CelestialObject[], count: totalCount };
}

export interface TypeBucket {
  label: string;
  count: number;
  values: string[]; // raw obj_type values that map to this bucket
}

function titleCase(s: string) {
  return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Display-only overrides for bucket labels. Filtering still uses the raw obj_type values.
const DISPLAY_LABEL_OVERRIDES: Record<string, string> = {
  Star: "Stars & Asterisms",
};

async function fetchTypeBuckets(): Promise<TypeBucket[]> {
  const PAGE = 1000;
  let from = 0;
  const all: string[] = [];
  // Paginate to fetch all obj_type values (catalog can exceed default 1000-row cap)
  // Safety cap at 20k rows.
  while (from < 20000) {
    const { data, error } = await supabase
      .from("celestial_objects")
      .select("obj_type")
      .not("obj_type", "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      const v = (r as any).obj_type as string | null;
      if (v) all.push(v);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const map = new Map<string, { count: number; values: Set<string>; displayLabel: string }>();
  for (const raw of all) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const norm = titleCase(trimmed);
    const displayLabel = DISPLAY_LABEL_OVERRIDES[norm] ?? norm;
    const entry = map.get(norm) ?? { count: 0, values: new Set<string>(), displayLabel };
    entry.count += 1;
    entry.values.add(raw);
    map.set(norm, entry);
  }

  const buckets: TypeBucket[] = [];
  const other: TypeBucket = { label: "Other", count: 0, values: [] };
  for (const [label, { count, values, displayLabel }] of map.entries()) {
    if (count <= 1 || label.toLowerCase() === "other") {
      other.count += count;
      other.values.push(...values);
    } else {
      buckets.push({ label: displayLabel, count, values: [...values] });
    }
  }
  buckets.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  if (other.count > 0) {
    // De-duplicate raw values just in case
    other.values = [...new Set(other.values)];
    buckets.push(other);
  }
  return buckets;
}

async function fetchDistinctConstellations() {
  const { data, error } = await supabase
    .from("celestial_objects")
    .select("constellation")
    .not("constellation", "is", null)
    .limit(1000);
  if (error) throw error;
  const unique = [...new Set((data || []).map((d: any) => d.constellation))].filter(Boolean).sort();
  return unique as string[];
}

export function useDistinctFilters() {
  const typeBucketsQ = useQuery({ queryKey: ["celestial-type-buckets"], queryFn: fetchTypeBuckets, staleTime: Infinity });
  const constellations = useQuery({ queryKey: ["celestial-constellations"], queryFn: fetchDistinctConstellations, staleTime: Infinity });
  const typeBuckets = typeBucketsQ.data ?? [];
  // Back-compat: expose flat type labels too
  const types = typeBuckets.map((b) => b.label);
  return { types, typeBuckets, constellations: constellations.data ?? [] };
}

export function useCelestialObjects(filters: CelestialFilters, page: number) {
  return useQuery({
    queryKey: ["celestial-objects", filters, page],
    queryFn: () => fetchObjects(filters, page),
    staleTime: 60_000,
  });
}

export { PAGE_SIZE };

export type CatalogTypeCount = { obj_type: string; n: number };

export function useCatalogTypeCounts(filters: CelestialFilters) {
  const params = {
    p_catalog: filters.catalog || "",
    p_constellation: filters.constellation || "",
    p_max_magnitude: filters.maxMagnitude,
    p_min_photo_score: filters.minPhotoScore,
    p_min_size: filters.minSize,
    p_max_size: filters.maxSize,
    p_search: filters.search || "",
  };
  return useQuery({
    queryKey: ["catalog-type-counts", params],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("catalog_type_counts" as any, params as any);
      if (error) throw error;
      return (data ?? []) as CatalogTypeCount[];
    },
    staleTime: 30_000,
  });
}

