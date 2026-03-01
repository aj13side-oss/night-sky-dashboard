import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getMoonPhase } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal } from "@/lib/timezone";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const MoonPhaseCard = () => {
  const { date, location } = useObservation();
  const { data, isLoading } = useAstronomyData();
  const tz = location.timezone;

  const toLocal = (utc: string | null | undefined) => utc ? utcToLocal(utc, date, tz) : null;

  const localMoon = getMoonPhase(date);
  const phaseName = data?.moon?.phase || localMoon.name;
  const illumination = data?.moon?.fracillum ?? localMoon.illumination;
  const moonrise = toLocal(data?.moon?.moonrise);
  const moonset = toLocal(data?.moon?.moonset);
  const closestPhase = data?.moon?.closestPhase;

  const isWaxing = phaseName.toLowerCase().includes("waxing") ||
    phaseName.toLowerCase().includes("first") ||
    phaseName.toLowerCase().includes("new") ||
    phaseName.toLowerCase().includes("croissant");
  const fraction = illumination / 100;

  const buildMoonPath = (frac: number, waxing: boolean) => {
    const r = 60;
    if (frac < 0.01) return "";
    if (frac > 0.99) return `M 0,-${r} A ${r},${r} 0 1,1 0,${r} A ${r},${r} 0 1,1 0,-${r} Z`;

    const sweep = waxing ? frac : 1 - frac;
    const cx = Math.abs(r * (2 * sweep - 1));
    const largeArc = sweep > 0.5 ? 1 : 0;

    if (waxing) {
      return `M 0,-${r} A ${r},${r} 0 0,1 0,${r} A ${cx},${r} 0 0,${largeArc} 0,-${r} Z`;
    } else {
      return `M 0,-${r} A ${r},${r} 0 0,0 0,${r} A ${cx},${r} 0 0,${1 - largeArc} 0,-${r} Z`;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Moon Phase</h3>
        {isLoading ? (
          <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
        ) : data?.moon ? (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> USNO
          </span>
        ) : null}
      </div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-32 h-32"
      >
        <svg viewBox="-70 -70 140 140" className="w-full h-full drop-shadow-lg">
          <circle cx="0" cy="0" r="60" fill="hsl(220 15% 18%)" />
          <circle cx="-12" cy="-20" r="6" fill="hsl(220 10% 15%)" opacity="0.5" />
          <circle cx="15" cy="10" r="8" fill="hsl(220 10% 15%)" opacity="0.4" />
          <circle cx="-5" cy="25" r="4" fill="hsl(220 10% 15%)" opacity="0.3" />
          <path d={buildMoonPath(fraction, isWaxing)} fill="url(#moonGradient)" />
          <clipPath id="litClip">
            <path d={buildMoonPath(fraction, isWaxing)} />
          </clipPath>
          <g clipPath="url(#litClip)">
            <circle cx="-12" cy="-20" r="6" fill="hsl(45 15% 70%)" opacity="0.3" />
            <circle cx="15" cy="10" r="8" fill="hsl(45 15% 70%)" opacity="0.25" />
            <circle cx="-5" cy="25" r="4" fill="hsl(45 15% 70%)" opacity="0.2" />
            <circle cx="20" cy="-15" r="5" fill="hsl(45 15% 70%)" opacity="0.2" />
          </g>
          <defs>
            <radialGradient id="moonGradient" cx="40%" cy="35%">
              <stop offset="0%" stopColor="hsl(50 30% 92%)" />
              <stop offset="60%" stopColor="hsl(45 20% 80%)" />
              <stop offset="100%" stopColor="hsl(40 15% 70%)" />
            </radialGradient>
          </defs>
        </svg>
        <div className="absolute -inset-3 rounded-full opacity-20 pointer-events-none"
          style={{ boxShadow: `0 0 40px 10px hsl(45 30% 70% / ${0.1 + fraction * 0.3})` }} />
      </motion.div>

      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-foreground">{phaseName}</p>
        <p className="text-sm text-muted-foreground">
          {illumination}% illuminated
        </p>
      </div>

      {(moonrise || moonset) && (
        <div className="w-full pt-3 border-t border-border space-y-1">
          {moonrise && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🌙 Moonrise</span>
              <span className="font-mono text-foreground">{moonrise}</span>
            </div>
          )}
          {moonset && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🌙 Moonset</span>
              <span className="font-mono text-foreground">{moonset}</span>
            </div>
          )}
        </div>
      )}

      {closestPhase && (
        <div className="text-[10px] text-muted-foreground text-center">
          Next: {closestPhase.phase} — {closestPhase.day}/{closestPhase.month} at {closestPhase.time}
        </div>
      )}
    </div>
  );
};

export default MoonPhaseCard;
