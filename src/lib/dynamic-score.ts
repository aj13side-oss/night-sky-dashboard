

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

export interface DisplaySeason {
  label: string | null;
  isSeason: boolean;
  isCircumpolar: boolean;
  isInvisible: boolean;
}

/**
 * Compute the season label to show for a user, based on the object's
 * base culmination season, its declination, and the user's latitude.
 */
export function getDisplaySeason(
  bestMonths: string | null,
  decDeg: number | null | undefined,
  userLatitude: number | null | undefined
): DisplaySeason {
  const lat = userLatitude ?? 45;
  if (decDeg != null) {
    if (decDeg > 90 - lat) {
      return { label: "Year-round", isSeason: false, isCircumpolar: true, isInvisible: false };
    }
    if (decDeg < lat - 90) {
      return { label: "Not visible from your location", isSeason: false, isCircumpolar: false, isInvisible: true };
    }
  }
  const base = getSeasonLabel(bestMonths);
  return { label: base, isSeason: base != null, isCircumpolar: false, isInvisible: false };
}

