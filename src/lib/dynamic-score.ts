import { calculateAltitude } from "./visibility";

const MONTH_TO_SEASON: Record<number, string> = {
  0: "Winter", 1: "Winter", 2: "Spring",
  3: "Spring", 4: "Spring", 5: "Summer",
  6: "Summer", 7: "Summer", 8: "Autumn",
  9: "Autumn", 10: "Autumn", 11: "Winter",
};

export function getCurrentSeason(): string {
  return MONTH_TO_SEASON[new Date().getMonth()];
}

export function getSeasonLabel(bestMonths: string | null): string | null {
  if (!bestMonths) return null;
  const normalized = bestMonths.trim();
  if (["Winter", "Spring", "Summer", "Autumn"].includes(normalized)) return normalized;
  return normalized;
}

export function getSeasonEmoji(season: string): string {
  switch (season) {
    case "Winter": return "❄️";
    case "Spring": return "🌸";
    case "Summer": return "☀️";
    case "Autumn": return "🍂";
    default: return "📅";
  }
}

export interface DynamicScore {
  base: number;
  seasonalBonus: number;
  altitudeBonus: number;
  total: number;
  isSeasonal: boolean;
  isHighAltitude: boolean;
}

export function computeDynamicScore(
  photoScore: number | null,
  bestMonths: string | null,
  ra: number | null,
  dec: number | null,
  lat: number,
  lng: number
): DynamicScore {
  const base = photoScore ?? 0;
  const currentSeason = getCurrentSeason();
  const objectSeason = getSeasonLabel(bestMonths);

  const isSeasonal = objectSeason != null && objectSeason === currentSeason;
  const seasonalBonus = isSeasonal ? 10 : 0;

  let altitudeBonus = 0;
  let isHighAltitude = false;
  if (ra != null && dec != null) {
    const alt = calculateAltitude(ra, dec, lat, lng);
    if (alt > 45) {
      altitudeBonus = 10;
      isHighAltitude = true;
    }
  }

  return {
    base,
    seasonalBonus,
    altitudeBonus,
    total: base + seasonalBonus + altitudeBonus,
    isSeasonal,
    isHighAltitude,
  };
}
