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
  sortBy: "photo_score" | "magnitude" | "size_max" | "catalog_id" | "tonight_best";
  sizeCategory?: "small" | "medium" | "large" | "";
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

  const from = page * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as CelestialObject[], count: count ?? 0 };
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
