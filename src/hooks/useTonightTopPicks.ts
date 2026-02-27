import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "./useCelestialObjects";
import { computeDynamicScore } from "@/lib/dynamic-score";

/**
 * Fetches top photo-scored DSOs and re-ranks by dynamic score (base + seasonal + altitude).
 */
export function useTonightTopPicks(lat: number, lng: number, count = 3) {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ["tonight-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("celestial_objects")
        .select("*")
        .not("obj_type", "in", '("Star","Double Star")')
        .order("photo_score", { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return data as CelestialObject[];
    },
    staleTime: 300_000,
  });

  const topPicks = useMemo(() => {
    if (!candidates) return [];
    return candidates
      .map((obj) => ({
        obj,
        score: computeDynamicScore(obj.photo_score, obj.best_months, obj.ra, obj.dec, lat, lng),
      }))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, count);
  }, [candidates, lat, lng, count]);

  return { topPicks, isLoading };
}
