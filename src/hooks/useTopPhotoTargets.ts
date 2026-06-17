import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTopPhotoTargets() {
  return useQuery<Set<string>>({
    queryKey: ["top-photo-targets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("top_photo_targets")
        .select("catalog_id");
      if (error) return new Set<string>();
      const ids = (data ?? [])
        .map((row: any) => row.catalog_id)
        .filter((id: unknown): id is string => typeof id === "string");
      return new Set(ids);
    },
    staleTime: 300_000,
  });
}
