import { calculateAltitude } from "./visibility";

export interface RiseSetTransit {
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date | null;
  transitAlt: number;
  bestWindowStart: Date | null;
  bestWindowEnd: Date | null;
  isCircumpolar: boolean;
  neverRises: boolean;
}

/**
 * Calculate rise, set, transit, and best imaging window for a celestial object.
 * Scans from twilightStart to twilightEnd in 5-minute increments.
 */
export function getObjectRiseSetTransit(
  ra: number,
  dec: number,
  lat: number,
  lng: number,
  date: Date,
  twilightStartHour = 18,
  twilightEndHour = 6
): RiseSetTransit {
  const baseDate = new Date(date);
  baseDate.setHours(twilightStartHour, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(twilightEndHour, 0, 0, 0);

  const stepMinutes = 5;
  let maxAlt = -999;
  let transitTime: Date | null = null;
  let riseTime: Date | null = null;
  let setTime: Date | null = null;
  let bestWindowStart: Date | null = null;
  let bestWindowEnd: Date | null = null;
  let prevAlt = -999;
  let aboveHorizonCount = 0;
  let belowHorizonCount = 0;
  const totalSteps = Math.ceil((endDate.getTime() - baseDate.getTime()) / (stepMinutes * 60000));

  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(baseDate.getTime() + i * stepMinutes * 60000);
    const alt = calculateAltitude(ra, dec, lat, lng, t);

    if (alt > maxAlt) {
      maxAlt = alt;
      transitTime = t;
    }

    // Rise: previous below 0, current above 0
    if (prevAlt <= 0 && alt > 0 && !riseTime) {
      riseTime = t;
    }

    // Set: previous above 0, current below 0
    if (prevAlt > 0 && alt <= 0) {
      setTime = t;
    }

    // Best window (above 30°)
    if (alt >= 30 && !bestWindowStart) {
      bestWindowStart = t;
    }
    if (prevAlt >= 30 && alt < 30 && bestWindowStart) {
      bestWindowEnd = t;
    }

    if (alt > 0) aboveHorizonCount++;
    else belowHorizonCount++;

    prevAlt = alt;
  }

  // Close best window if still open
  if (bestWindowStart && !bestWindowEnd) {
    bestWindowEnd = endDate;
  }

  const isCircumpolar = belowHorizonCount === 0 && aboveHorizonCount > 0;
  const neverRises = aboveHorizonCount === 0;

  return {
    riseTime,
    setTime,
    transitTime,
    transitAlt: maxAlt,
    bestWindowStart,
    bestWindowEnd,
    isCircumpolar,
    neverRises,
  };
}

export function formatTimeShort(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function getBestWindowLabel(rs: RiseSetTransit): string {
  if (rs.neverRises) return "Not visible tonight";
  if (rs.isCircumpolar && rs.bestWindowStart) {
    return `Circumpolar — visible all night (peak ${rs.transitAlt.toFixed(0)}°)`;
  }
  if (rs.isCircumpolar) return "Circumpolar — low altitude";
  if (rs.bestWindowStart && rs.bestWindowEnd) {
    return `Best window: ${formatTimeShort(rs.bestWindowStart)} — ${formatTimeShort(rs.bestWindowEnd)} (above 30°)`;
  }
  if (rs.riseTime || rs.setTime) {
    return `Visible but below 30° — peak ${rs.transitAlt.toFixed(0)}° at ${formatTimeShort(rs.transitTime)}`;
  }
  return "Limited visibility";
}
