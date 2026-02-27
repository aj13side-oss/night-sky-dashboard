import { getMoonPhase } from "@/lib/astronomy";
import { Moon } from "lucide-react";

interface Props {
  targetRa: number | null;
  targetDec: number | null;
}

function getMoonRaDec(date: Date): { ra: number; dec: number } {
  // Simplified moon position using mean elements
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525.0;
  const L = (218.3164477 + 481267.88123421 * T) % 360;
  const D = (297.8501921 + 445267.1114034 * T) % 360;
  const M = (357.5291092 + 35999.0502909 * T) % 360;
  const Mp = (134.9633964 + 477198.8675055 * T) % 360;
  const F = (93.272095 + 483202.0175233 * T) % 360;

  const toRad = (d: number) => (d * Math.PI) / 180;

  const lon = L + 6.289 * Math.sin(toRad(Mp)) + 1.274 * Math.sin(toRad(2 * D - Mp))
    + 0.658 * Math.sin(toRad(2 * D)) + 0.214 * Math.sin(toRad(2 * Mp));
  const lat = 5.128 * Math.sin(toRad(F));
  const eps = 23.4393 - 0.0000004 * (JD - 2451545.0);

  const lonRad = toRad(lon);
  const latRad = toRad(lat);
  const epsRad = toRad(eps);

  const ra = Math.atan2(
    Math.sin(lonRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad),
    Math.cos(lonRad)
  ) * (180 / Math.PI);
  const dec = Math.asin(
    Math.sin(latRad) * Math.cos(epsRad) + Math.cos(latRad) * Math.sin(epsRad) * Math.sin(lonRad)
  ) * (180 / Math.PI);

  return { ra: ((ra % 360) + 360) % 360, dec };
}

function angularDistance(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dec1Rad = toRad(dec1);
  const dec2Rad = toRad(dec2);
  const dRa = toRad(ra2 - ra1);
  const dDec = dec2Rad - dec1Rad;
  const a = Math.sin(dDec / 2) ** 2 + Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(dRa / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * (180 / Math.PI);
}

const NightPlanner = ({ targetRa, targetDec }: Props) => {
  const moon = getMoonPhase();
  const moonPos = getMoonRaDec(new Date());

  const moonDist = targetRa != null && targetDec != null
    ? angularDistance(targetRa, targetDec, moonPos.ra, moonPos.dec)
    : null;

  const moonImpact = moonDist != null
    ? moonDist < 20 ? { label: "Too close — strong interference", color: "text-destructive" }
    : moonDist < 45 ? { label: "Moderate — expect some glow", color: "text-orange-400" }
    : moonDist < 90 ? { label: "Acceptable distance", color: "text-primary" }
    : { label: "Great separation ✓", color: "text-accent" }
    : null;

  return (
    <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Moon className="w-4 h-4 text-primary" />
        Night Planner
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Moon Phase</span>
          <p className="font-medium text-foreground">{moon.emoji} {moon.name}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Illumination</span>
          <p className="font-medium text-foreground">{moon.illumination}%</p>
        </div>
        {moonDist != null && (
          <>
            <div>
              <span className="text-muted-foreground">Moon Distance</span>
              <p className="font-medium font-mono text-foreground">{moonDist.toFixed(1)}°</p>
            </div>
            <div>
              <span className="text-muted-foreground">Impact</span>
              <p className={`font-medium ${moonImpact?.color}`}>{moonImpact?.label}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NightPlanner;
