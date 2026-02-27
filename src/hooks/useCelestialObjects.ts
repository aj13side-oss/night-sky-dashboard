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
  magnitude: number | null;
  surf_brightness: number | null;
  size_max: number | null;
  photo_score: number | null;
  exposure_guide_fast: number | null;
  exposure_guide_deep: number | null;
}

export interface CelestialFilters {
  search: string;
  objTypes: string[];
  excludeTypes: string[];
  constellation: string;
  maxMagnitude: number;
  minPhotoScore: number;
  sortBy: "photo_score" | "magnitude" | "size_max" | "catalog_id" | "tonight_best";
  sizeCategory?: "small" | "medium" | "large" | "";
  limitResults?: number;
}

const PAGE_SIZE = 30;

async function fetchObjects(filters: CelestialFilters, page: number) {
  let query = supabase
    .from("celestial_objects")
    .select("*", { count: "exact" });

  if (filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`catalog_id.ilike.${term},common_name.ilike.${term}`);
  }

  if (filters.objTypes.length > 0) {
    query = query.in("obj_type", filters.objTypes);
  } else if (filters.excludeTypes.length > 0) {
    for (const t of filters.excludeTypes) {
      query = query.neq("obj_type", t);
    }
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

  // Size category filter
  if (filters.sizeCategory === "small") {
    query = query.lt("size_max", 5);
  } else if (filters.sizeCategory === "medium") {
    query = query.gte("size_max", 5).lte("size_max", 30);
  } else if (filters.sizeCategory === "large") {
    query = query.gt("size_max", 30);
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

  // If limitResults is set, cap total and range
  const effectivePageSize = filters.limitResults && filters.limitResults < PAGE_SIZE ? filters.limitResults : PAGE_SIZE;
  const from = page * effectivePageSize;
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

async function fetchDistinctTypes() {
  const { data, error } = await supabase
    .from("celestial_objects")
    .select("obj_type")
    .limit(1000);
  if (error) throw error;
  const unique = [...new Set((data || []).map((d: any) => d.obj_type))].sort();
  return unique as string[];
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
  const types = useQuery({ queryKey: ["celestial-types"], queryFn: fetchDistinctTypes, staleTime: Infinity });
  const constellations = useQuery({ queryKey: ["celestial-constellations"], queryFn: fetchDistinctConstellations, staleTime: Infinity });
  return { types: types.data ?? [], constellations: constellations.data ?? [] };
}

export function useCelestialObjects(filters: CelestialFilters, page: number) {
  return useQuery({
    queryKey: ["celestial-objects", filters, page],
    queryFn: () => fetchObjects(filters, page),
    staleTime: 60_000,
  });
}

export { PAGE_SIZE };
