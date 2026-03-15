/**
 * Format RA in hours to HH h MM m SS s display
 */
export function formatRA(raHours: number | null): string {
  if (raHours == null) return "—";
  const h = Math.floor(raHours);
  const mFull = (raHours - h) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Format Dec in degrees to ±DD° MM' SS" display
 */
export function formatDec(decDeg: number | null): string {
  if (decDeg == null) return "—";
  const sign = decDeg >= 0 ? "+" : "-";
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const mFull = (abs - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return `${sign}${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;
}
