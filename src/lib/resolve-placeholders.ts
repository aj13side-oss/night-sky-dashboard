import type { CelestialObject } from "@/hooks/useCelestialObjects";
import type { LabelMaps } from "@/hooks/useLabelMaps";
import { getDisplaySeason } from "@/lib/dynamic-score";
import { formatExposure } from "@/lib/format-exposure";

export type Lang = "fr" | "en";

function translateSimple(key: string | null | undefined, dict: Record<string, string>, lang: Lang): string | null {
  if (!key) return null;
  if (lang === "en") return key;
  const v = dict[key];
  return v && v.length > 0 ? v : null;
}

function translateObjType(key: string | null | undefined, maps: LabelMaps, lang: Lang): string | null {
  if (!key) return null;
  const entry = maps.objType[key];
  if (!entry) return lang === "en" ? key : null;
  if (lang === "fr") return entry.label_fr || null;
  return entry.label_en || key;
}

function formatSize(sizeArcmin: number | null | undefined, lang: Lang): string | null {
  if (sizeArcmin == null || sizeArcmin <= 0) return null;
  if (sizeArcmin > 60) {
    const deg = sizeArcmin / 60;
    return lang === "fr" ? `${deg.toFixed(1)}°` : `${deg.toFixed(1)}°`;
  }
  return `${sizeArcmin.toFixed(1)}′`;
}

function formatMagnitude(mag: number | null | undefined, lang: Lang): string | null {
  if (mag == null) return null;
  return lang === "fr" ? `magnitude ${mag.toFixed(1)}` : `magnitude ${mag.toFixed(1)}`;
}

function formatSurfBright(v: number | null | undefined): string | null {
  if (v == null) return null;
  return v.toFixed(1);
}

function formatDec(decDeg: number | null | undefined): string | null {
  if (decDeg == null) return null;
  const sign = decDeg >= 0 ? "+" : "−";
  return `${sign}${Math.abs(decDeg).toFixed(1)}°`;
}

function formatSeason(obj: CelestialObject, userLat: number | null, maps: LabelMaps, lang: Lang): string | null {
  const s = getDisplaySeason(obj.best_months, obj.dec_deg, userLat);
  if (s.isCircumpolar || s.isInvisible) return null;
  if (!s.label) return null;
  if (lang === "en") return s.label;
  // French - translate via season dictionary, fallback to label
  return maps.season[s.label] ?? s.label;
}

function formatSharpless(v: number | null | undefined, _lang: Lang): string | null {
  if (v == null) return null;
  return `${v}`;
}

/**
 * Compute the string value for each known placeholder.
 * Returns null if the value cannot be computed (placeholder should be removed).
 */
function resolveVariable(
  name: string,
  obj: CelestialObject,
  lang: Lang,
  maps: LabelMaps,
  userLat: number | null,
): string | null {
  switch (name) {
    case "size":
      return formatSize(obj.size_max, lang);
    case "mag":
      return formatMagnitude(obj.magnitude, lang);
    case "surfbright":
      return formatSurfBright(obj.surf_brightness);
    case "dec":
      return formatDec(obj.dec_deg);
    case "constellation":
      return translateSimple(obj.constellation, maps.constellation, lang);
    case "type":
      return translateObjType(obj.obj_type, maps, lang);
    case "season":
      return formatSeason(obj, userLat, maps, lang);
    case "fast":
      return formatExposure(obj.exposure_guide_fast);
    case "deep":
      return formatExposure(obj.exposure_guide_deep);
    case "filter":
      return translateSimple(obj.recommended_filter, maps.filter, lang);
    case "rarity":
      return translateSimple(obj.rarity, maps.rarity, lang);
    case "sharpless":
      return formatSharpless(obj.sharpless_brightness, lang);
    default:
      return null;
  }
}

/**
 * Resolve {{placeholder}} variables in `text`. Missing values are removed
 * cleanly: no leftover braces, no double spaces, no space before punctuation.
 */
export function resolvePlaceholders(
  text: string,
  obj: CelestialObject,
  lang: Lang,
  maps: LabelMaps,
  userLat: number | null = null,
): string {
  if (!text) return "";
  // Replace each placeholder with value or a unique sentinel for cleanup.
  const SENTINEL = "\u0000MISSING\u0000";
  let out = text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, name: string) => {
    const v = resolveVariable(name, obj, lang, maps, userLat);
    return v == null || v === "" ? SENTINEL : v;
  });

  // Cleanup: remove whitespace before/around sentinel, then drop space-before-punct and double spaces.
  // Repeatedly collapse "word SENTINEL" / "SENTINEL word" patterns.
  // Step 1: drop sentinel together with one adjacent space when present.
  out = out.replace(/\s*\u0000MISSING\u0000\s*/g, " ");
  // Step 2: tidy space before punctuation.
  out = out.replace(/\s+([,.;:!?\)])/g, "$1");
  // Step 3: tidy space after opening bracket.
  out = out.replace(/([\(])\s+/g, "$1");
  // Step 4: collapse multiple spaces.
  out = out.replace(/[ \t]{2,}/g, " ");
  // Step 5: clean empty parentheses.
  out = out.replace(/\(\s*\)/g, "");
  // Step 6: trim spaces at line boundaries.
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  return out.trim();
}
