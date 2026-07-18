// Shared Bortle chip color mapping. Tailwind classes only — no inline styles.
export function bortleChipClass(b: number): string {
  if (b <= 2) return "text-green-400 border-green-400/40";
  if (b <= 3) return "text-emerald-400 border-emerald-400/40";
  if (b <= 4) return "text-teal-400 border-teal-400/40";
  if (b <= 5) return "text-yellow-400 border-yellow-400/40";
  if (b <= 6) return "text-orange-400 border-orange-400/40";
  if (b <= 7) return "text-orange-500 border-orange-500/40";
  return "text-red-400 border-red-400/40";
}

// Raw hex for Leaflet markers where we can't use Tailwind.
export function bortleHex(b: number): string {
  if (b <= 2) return "#4ade80";
  if (b <= 3) return "#34d399";
  if (b <= 4) return "#2dd4bf";
  if (b <= 5) return "#facc15";
  if (b <= 6) return "#fb923c";
  if (b <= 7) return "#f97316";
  return "#f87171";
}
