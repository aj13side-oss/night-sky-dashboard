export function calculateAltitude(
  raDeg: number,
  decDeg: number,
  lat: number,
  lng: number,
  date: Date = new Date()
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525.0;
  let GMST =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  GMST = ((GMST % 360) + 360) % 360;

  const LST = ((GMST + lng) % 360 + 360) % 360;
  const HA = ((LST - raDeg) % 360 + 360) % 360;

  const haRad = toRad(HA);
  const decRad = toRad(decDeg);
  const latRad = toRad(lat);

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);

  return toDeg(Math.asin(sinAlt));
}

export function getVisibilityLabel(altitude: number): {
  label: string;
  color: string;
} {
  if (altitude > 60) return { label: "Excellent", color: "text-green-400" };
  if (altitude > 30) return { label: "Good", color: "text-emerald-400" };
  if (altitude > 15) return { label: "Fair", color: "text-primary" };
  if (altitude > 0) return { label: "Low", color: "text-orange-400" };
  return { label: "Below horizon", color: "text-destructive" };
}
