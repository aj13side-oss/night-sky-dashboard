// Custom location storage — one slot, localStorage only.
// Persists across sessions but never leaves the device.

export interface CustomLocation {
  label: string;
  lat: number;
  lng: number;
}

const KEY = "cf_custom_location";

export const readCustomLocation = (): CustomLocation | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p.label === "string" &&
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      isValidLat(p.lat) &&
      isValidLng(p.lng)
    ) {
      return { label: p.label.slice(0, 60), lat: p.lat, lng: p.lng };
    }
  } catch {}
  return null;
};

export const saveCustomLocation = (loc: CustomLocation): void => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ label: loc.label.slice(0, 60), lat: loc.lat, lng: loc.lng }),
    );
  } catch {}
};

export const clearCustomLocation = (): void => {
  try { localStorage.removeItem(KEY); } catch {}
};

export const isValidLat = (n: number) => Number.isFinite(n) && n >= -90 && n <= 90;
export const isValidLng = (n: number) => Number.isFinite(n) && n >= -180 && n <= 180;

// Parse a "DD°MM'SS\"" or "DD MM SS" DMS string → decimal degrees.
// Returns null when the string can't be parsed.
export const parseDMS = (raw: string): number | null => {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(
    /^\s*(-?\d+(?:\.\d+)?)[°\s:]+(\d+(?:\.\d+)?)[\s'′:]+(\d+(?:\.\d+)?)?["″\s]*([NSEWnsew])?\s*$/,
  );
  if (!m) return null;
  const deg = parseFloat(m[1]);
  const min = parseFloat(m[2]);
  const sec = m[3] ? parseFloat(m[3]) : 0;
  const hemi = m[4]?.toUpperCase();
  if (!Number.isFinite(deg) || !Number.isFinite(min) || !Number.isFinite(sec)) return null;
  const sign = deg < 0 ? -1 : 1;
  let dec = Math.abs(deg) + min / 60 + sec / 3600;
  dec *= sign;
  if (hemi === "S" || hemi === "W") dec = -Math.abs(dec);
  if (hemi === "N" || hemi === "E") dec = Math.abs(dec);
  return dec;
};
