import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SolarSystemObject {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image_url: string | null;
  min_apparent_size_arcsec: number | null;
  max_apparent_size_arcsec: number | null;
  min_magnitude: number | null;
  max_magnitude: number | null;
  orbital_period_days: number | null;
  distance_au_min: number | null;
  distance_au_max: number | null;
  search_aliases: string | null;
  recommended_focal_mm: number | null;
  recommended_technique: string | null;
  recommended_filters: string | null;
  capture_fps: number | null;
  capture_duration_sec: number | null;
  capture_gain_note: string | null;
  difficulty: number | null;
  danger_warning: string | null;
  color_hex: string | null;
  sort_order: number | null;
  is_active: boolean;
  image_credit: string | null;
  image_license: string | null;
  image_source_url: string | null;
}

export function useSolarSystemObjects() {
  return useQuery({
    queryKey: ["solar-system-objects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solar_system_objects")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as SolarSystemObject[];
    },
    staleTime: Infinity,
  });
}
