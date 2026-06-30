import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SimpleLabelMap = Record<string, string>;
export interface ObjTypeLabel {
  label_fr: string;
  label_en: string;
  article_indef_fr: string | null;
  article_def_fr: string | null;
  gender: string | null;
}
export type ObjTypeLabelMap = Record<string, ObjTypeLabel>;

export interface LabelMaps {
  constellation: SimpleLabelMap;
  season: SimpleLabelMap;
  rarity: SimpleLabelMap;
  objType: ObjTypeLabelMap;
  filter: SimpleLabelMap;
  resolution: SimpleLabelMap;
}

async function loadSimple(table: string, keyCol: string): Promise<SimpleLabelMap> {
  const { data, error } = await (supabase as any).from(table).select(`${keyCol}, label_fr`);
  if (error) throw error;
  const out: SimpleLabelMap = {};
  for (const row of (data ?? []) as any[]) {
    if (row[keyCol]) out[row[keyCol]] = row.label_fr ?? "";
  }
  return out;
}

async function loadObjType(): Promise<ObjTypeLabelMap> {
  const { data, error } = await (supabase as any)
    .from("obj_type_labels")
    .select("obj_type, label_fr, label_en, article_indef_fr, article_def_fr, gender");
  if (error) throw error;
  const out: ObjTypeLabelMap = {};
  for (const row of (data ?? []) as any[]) {
    if (row.obj_type) {
      out[row.obj_type] = {
        label_fr: row.label_fr ?? "",
        label_en: row.label_en ?? "",
        article_indef_fr: row.article_indef_fr ?? null,
        article_def_fr: row.article_def_fr ?? null,
        gender: row.gender ?? null,
      };
    }
  }
  return out;
}

async function fetchLabelMaps(): Promise<LabelMaps> {
  const [constellation, season, rarity, objType, filter, resolution] = await Promise.all([
    loadSimple("constellation_labels", "constellation_en"),
    loadSimple("season_labels", "season_en"),
    loadSimple("rarity_labels", "rarity_en"),
    loadObjType(),
    loadSimple("filter_labels", "filter_en"),
    loadSimple("resolution_labels", "resolution_en"),
  ]);
  return { constellation, season, rarity, objType, filter, resolution };
}

export function useLabelMaps() {
  return useQuery({
    queryKey: ["label-maps"],
    queryFn: fetchLabelMaps,
    staleTime: Infinity,
  });
}
