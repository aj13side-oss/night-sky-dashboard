/**
 * Moon phase calculations using synodic month.
 * Reference new moon: 2000-01-06 18:14 UTC
 */

const SYNODIC_MONTH = 29.53058770576;
const REF_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();

export interface MoonPhaseInfo {
  phase: number; // 0-1 (0 = new, 0.5 = full)
  name: string;
  illumination: number; // 0-100
  emoji: string;
  isWaxing: boolean;
}

export function getMoonPhaseInfo(date: Date = new Date()): MoonPhaseInfo {
  const diff = date.getTime() - REF_NEW_MOON;
  const days = diff / 86400000;
  const phase = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH / SYNODIC_MONTH;
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  const isWaxing = phase < 0.5;

  let name: string;
  let emoji: string;
  if (phase < 0.03 || phase > 0.97) { name = "New Moon"; emoji = "🌑"; }
  else if (phase < 0.22) { name = "Waxing Crescent"; emoji = "🌒"; }
  else if (phase < 0.28) { name = "First Quarter"; emoji = "🌓"; }
  else if (phase < 0.47) { name = "Waxing Gibbous"; emoji = "🌔"; }
  else if (phase < 0.53) { name = "Full Moon"; emoji = "🌕"; }
  else if (phase < 0.72) { name = "Waning Gibbous"; emoji = "🌖"; }
  else if (phase < 0.78) { name = "Last Quarter"; emoji = "🌗"; }
  else { name = "Waning Crescent"; emoji = "🌘"; }

  return { phase, name, illumination, emoji, isWaxing };
}

/**
 * Simplified moonrise/moonset estimation.
 * New moon rises/sets with the sun. Full moon is opposite.
 * Returns approximate hours (0-24) for the given date.
 */
export function estimateMoonTimes(
  date: Date,
  sunriseHour: number,
  sunsetHour: number
): { moonrise: string; moonset: string } {
  const { phase } = getMoonPhaseInfo(date);
  // Moon rises ~50 min later each day relative to sun
  const offset = phase * 24; // hours after sunrise
  const riseH = (sunriseHour + offset) % 24;
  const setH = (riseH + 12) % 24;
  const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  return { moonrise: fmt(riseH), moonset: fmt(setH) };
}
