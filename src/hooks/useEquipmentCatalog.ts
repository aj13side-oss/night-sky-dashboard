import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AstroCamera {
  id: string;
  brand: string;
  model: string;
  sensor_width_mm: number | null;
  sensor_height_mm: number | null;
  pixel_size_um: number | null;
  is_color: boolean | null;
  image_url: string | null;
  affiliate_amazon: string | null;
  affiliate_astro: string | null;
  weight_kg: number | null;
  internal_backfocus_mm: number | null;
  qe_percent: number | null;
  read_noise_e: number | null;
  interface_type: string | null;
  resolution_x: number | null;
  resolution_y: number | null;
}

export interface AstroTelescope {
  id: string;
  brand: string;
  model: string;
  focal_length_mm: number | null;
  aperture_mm: number | null;
  type: string | null;
  weight_kg: number | null;
  image_url: string | null;
  affiliate_amazon: string | null;
  affiliate_astro: string | null;
  required_backfocus_mm: number | null;
  image_circle_mm: number | null;
}

export interface AstroMount {
  id: string;
  brand: string;
  model: string;
  payload_kg: number | null;
  mount_weight_kg: number | null;
  mount_type: string | null;
  image_url: string | null;
  affiliate_amazon: string | null;
  affiliate_astro: string | null;
  connectivity: string | null;
}

export interface AstroFilter {
  id: string;
  brand: string;
  model: string;
  type: string | null;
  size: string | null;
  image_url: string | null;
  affiliate_amazon: string | null;
  affiliate_astro: string | null;
  thickness_mm: number | null;
}

export function useCameras() {
  return useQuery({
    queryKey: ["astro_cameras"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("astro_cameras")
        .select("*")
        .order("brand");
      if (error) throw error;
      return (data ?? []) as AstroCamera[];
    },
  });
}

export function useTelescopes() {
  return useQuery({
    queryKey: ["astro_telescopes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("astro_telescopes")
        .select("*")
        .order("brand");
      if (error) throw error;
      return (data ?? []) as AstroTelescope[];
    },
  });
}

export function useMounts() {
  return useQuery({
    queryKey: ["astro_mounts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("astro_mounts")
        .select("*")
        .order("brand");
      if (error) throw error;
      return (data ?? []) as AstroMount[];
    },
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ["astro_filters"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("astro_filters")
        .select("*")
        .order("brand");
      if (error) throw error;
      return (data ?? []) as AstroFilter[];
    },
  });
}
