import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Retailer price/url pairs — column names match DB: price_amazon, url_amazon, etc.
const RETAILERS = [
  "amazon",
  "pierro_astro",
  "optique_unterlinden",
  "agena",
  "high_point_scientific",
  "astronome_fr",
  "astroshop_de",
  "univers_astro",
] as const;
type RetailerKey = typeof RETAILERS[number];

export interface RetailerInfo {
  key: RetailerKey;
  label: string;
  price: number | null;
  url: string | null;
}

const RETAILER_LABELS: Record<RetailerKey, string> = {
  amazon: "Amazon",
  pierro_astro: "Pierro Astro",
  optique_unterlinden: "Optique Unterlinden",
  agena: "Agena Astro",
  high_point_scientific: "High Point Scientific",
  astronome_fr: "Astronome.fr",
  astroshop_de: "Astroshop",
  univers_astro: "Univers Astro",
};

/** Extract best price and all retailer info from a raw DB row */
export function extractPrices(row: Record<string, any>): { best: { price: number; label: string; url: string | null } | null; retailers: RetailerInfo[] } {
  const retailers: RetailerInfo[] = RETAILERS.map(key => ({
    key,
    label: RETAILER_LABELS[key],
    price: row[`price_${key}`] ?? null,
    url: row[`url_${key}`] ?? null,
  }));
  const withPrice = retailers.filter(r => r.price != null && r.price > 0);
  withPrice.sort((a, b) => a.price! - b.price!);
  const best = withPrice.length > 0 ? { price: withPrice[0].price!, label: withPrice[0].label, url: withPrice[0].url } : null;
  return { best, retailers: withPrice };
}

export interface AstroCamera {
  id: string;
  brand: string;
  model: string;
  sensor_name: string | null;
  sensor_width_mm: number | null;
  sensor_height_mm: number | null;
  pixel_size_um: number | null;
  resolution_x: number | null;
  resolution_y: number | null;
  resolution_mp: number | null;
  is_color: boolean | null;
  image_url: string | null;
  url_amazon: string | null;
  url_astroshop_de: string | null;
  url_manufacturer: string | null;
  weight_g: number | null;
  weight_kg: number | null;
  internal_backfocus_mm: number | null;
  qe_percent: number | null;
  read_noise_e: number | null;
  full_well_e: number | null;
  adc_bits: number | null;
  cooling_delta_c: number | null;
  interface_usb: string | null;
  interface_type: string | null;
  _raw: Record<string, any>;
}

export interface AstroTelescope {
  id: string;
  brand: string;
  model: string;
  focal_length_mm: number | null;
  aperture_mm: number | null;
  f_ratio: number | null;
  type: string | null;
  weight_kg: number | null;
  image_url: string | null;
  url_amazon: string | null;
  url_astroshop_de: string | null;
  url_manufacturer: string | null;
  required_backfocus_mm: number | null;
  image_circle_mm: number | null;
  output_thread: string | null;
  dovetail_type: string | null;
  focuser_size_inch: number | null;
  _raw: Record<string, any>;
}

export interface AstroMount {
  id: string;
  brand: string;
  model: string;
  payload_kg: number | null;
  mount_weight_kg: number | null;
  mount_type: string | null;
  image_url: string | null;
  url_amazon: string | null;
  url_astroshop_de: string | null;
  url_manufacturer: string | null;
  connectivity: string | null;
  periodic_error_arcsec: number | null;
  is_goto: boolean | null;
  power_required: string | null;
  ascom_indi: string | null;
  _raw: Record<string, any>;
}

export interface AstroFilter {
  id: string;
  brand: string;
  model: string;
  type: string | null;
  size: string | null;
  image_url: string | null;
  url_amazon: string | null;
  url_astroshop_de: string | null;
  url_manufacturer: string | null;
  thickness_mm: number | null;
  _raw: Record<string, any>;
}

export interface AstroAccessory {
  id: string;
  brand: string;
  model: string;
  category: string | null;
  optical_length_mm: number | null;
  weight_g: number | null;
  input_connection: string | null;
  output_connection: string | null;
  image_url: string | null;
  url_amazon: string | null;
  url_astroshop_de: string | null;
  url_manufacturer: string | null;
  _raw: Record<string, any>;
}

function mapCamera(row: any): AstroCamera {
  const weight_g = row.weight_g ?? null;
  return {
    ...row,
    weight_g,
    weight_kg: weight_g ? weight_g / 1000 : (row.weight_kg ?? null),
    interface_type: row.interface_usb ?? row.interface_type ?? null,
    url_amazon: row.url_amazon ?? null,
    url_astroshop_de: row.url_astroshop_de ?? null,
    url_manufacturer: row.url_manufacturer ?? null,
    _raw: row,
  };
}

export function useCameras() {
  return useQuery({
    queryKey: ["astro_cameras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("astro_cameras")
        .select("*")
        .order("brand");
      if (error) throw error;
      return ((data ?? []) as any[]).map(mapCamera) as AstroCamera[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useTelescopes() {
  return useQuery({
    queryKey: ["astro_telescopes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("astro_telescopes")
        .select("*")
        .order("brand");
      if (error) throw error;
      return ((data ?? []) as any[]).map(r => ({
        ...r,
        url_amazon: r.url_amazon ?? null,
        url_astroshop_de: r.url_astroshop_de ?? null,
        url_manufacturer: r.url_manufacturer ?? null,
        _raw: r,
      })) as AstroTelescope[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useMounts() {
  return useQuery({
    queryKey: ["astro_mounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("astro_mounts")
        .select("*")
        .order("brand");
      if (error) throw error;
      return ((data ?? []) as any[]).map(r => ({
        ...r,
        url_amazon: r.url_amazon ?? null,
        url_astroshop_de: r.url_astroshop_de ?? null,
        url_manufacturer: r.url_manufacturer ?? null,
        _raw: r,
      })) as AstroMount[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ["astro_filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("astro_filters")
        .select("*")
        .order("brand");
      if (error) throw error;
      return ((data ?? []) as any[]).map(r => ({
        ...r,
        url_amazon: r.url_amazon ?? null,
        url_astroshop_de: r.url_astroshop_de ?? null,
        url_manufacturer: r.url_manufacturer ?? null,
        _raw: r,
      })) as AstroFilter[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useAccessories() {
  return useQuery({
    queryKey: ["astro_accessories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("astro_accessories")
        .select("*")
        .order("brand");
      if (error) throw error;
      return ((data ?? []) as any[]).map(r => ({
        ...r,
        category: r.category ?? null,
        optical_length_mm: r.optical_length_mm ?? null,
        input_connection: r.input_connection ?? null,
        output_connection: r.output_connection ?? null,
        url_amazon: r.url_amazon ?? null,
        url_astroshop_de: r.url_astroshop_de ?? null,
        url_manufacturer: r.url_manufacturer ?? null,
        _raw: r,
      })) as AstroAccessory[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// Compatibility rules
export interface CompatibilityRule {
  id: string;
  rule_key: string;
  label: string;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
}

export function useCompatibilityRules() {
  return useQuery({
    queryKey: ["rig_compatibility_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rig_compatibility_rules")
        .select("*");
      if (error) throw error;
      return (data ?? []) as CompatibilityRule[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// Rig presets
export interface RigPreset {
  id: string;
  name: string;
  slug: string;
  description_fr: string;
  use_case: string;
  camera_id: string | null;
  telescope_id: string | null;
  mount_id: string | null;
  accessory_ids: string[] | null;
  budget_min_eur: number | null;
  budget_max_eur: number | null;
  difficulty_level: number | null;
  is_featured: boolean | null;
  sort_order: number | null;
}

export function useRigPresets() {
  return useQuery({
    queryKey: ["rig_presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rig_presets")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as RigPreset[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
