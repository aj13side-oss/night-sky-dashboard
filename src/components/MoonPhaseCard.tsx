import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getMoonPhase } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal } from "@/lib/timezone";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import * as Astronomy from "astronomy-engine";
import { Badge } from "@/components/ui/badge";

const FULL_MOON_NAMES: Record<number, string> = {
  0: "Wolf Moon", 1: "Snow Moon", 2: "Worm Moon", 3: "Pink Moon",
  4: "Flower Moon", 5: "Strawberry Moon", 6: "Buck Moon", 7: "Sturgeon Moon",
  8: "Harvest Moon", 9: "Hunter's Moon", 10: "Beaver Moon", 11: "Cold Moon",
};

const PHASE_EMOJIS: Record<string, string> = {
  "New Moon": "🌑", "First Quarter": "🌓", "Full Moon": "🌕", "Last Quarter": "🌗",
};

function getSeeingImpact(illum: number) {
  if (illum <= 25) return { label: "Excellent", color: "text-green-400", desc: "Dark skies, ideal for deep-sky" };
  if (illum <= 65) return { label: "Moderate", color: "text-amber-400", desc: "Partial interference" };
  return { label: "Poor", color: "text-red-400", desc: "Strong moonlight, avoid nebulae" };
}

function useEnhancedMoon(date: Date, lat: number, lng: number) {
  return useMemo(() => {
    try {
      const observer = new Astronomy.Observer(lat, lng, 0);
      const now = new Date(date);

      // Phase & illumination via astronomy-engine
      const illum = Astronomy.Illumination(Astronomy.Body.Moon, now);
      const phaseAngle = illum.phase_angle;
      const illumination = Math.round((1 + Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100);

      // Determine phase name from phase angle
      let phaseName: string;
      // Use MoonPhase which returns 0-360 degrees
      const moonPhase = Astronomy.MoonPhase(now);
      if (moonPhase < 22.5 || moonPhase >= 337.5) phaseName = "New Moon";
      else if (moonPhase < 67.5) phaseName = "Waxing Crescent";
      else if (moonPhase < 112.5) phaseName = "First Quarter";
      else if (moonPhase < 157.5) phaseName = "Waxing Gibbous";
      else if (moonPhase < 202.5) phaseName = "Full Moon";
      else if (moonPhase < 247.5) phaseName = "Waning Gibbous";
      else if (moonPhase < 292.5) phaseName = "Last Quarter";
      else phaseName = "Waning Crescent";

      // Culmination (transit)
      let culminationTime: string | null = null;
      let culminationAlt: number | null = null;
      try {
        const transit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, now);
        if (transit && transit.time) {
          const tDate = transit.time.date;
          culminationTime = tDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
          const hor = Astronomy.Horizon(transit.time, observer, transit.time.date.valueOf() ? transit.hor.ra : 0, transit.hor.dec, "normal");
          culminationAlt = Math.round(hor.altitude);
        }
      } catch {
        // Try alternative approach
      }

      // Better culmination via Horizon at transit
      if (culminationTime === null) {
        try {
          const transit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, now);
          if (transit) {
            const tDate = transit.time.date;
            culminationTime = tDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            culminationAlt = Math.round(transit.hor.altitude);
          }
        } catch { /* skip */ }
      }

      // Fix: use transit result properly
      try {
        const transit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, now);
        if (transit) {
          const tDate = transit.time.date;
          culminationTime = tDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
          culminationAlt = Math.round(transit.hor.altitude);
        }
      } catch { /* skip */ }

      // Next 4 phase milestones
      const nextPhases: { name: string; emoji: string; date: Date }[] = [];
      const phaseQuarters = [
        { quarter: 0, name: "New Moon" },
        { quarter: 1, name: "First Quarter" },
        { quarter: 2, name: "Full Moon" },
        { quarter: 3, name: "Last Quarter" },
      ];
      for (const pq of phaseQuarters) {
        try {
          const result = Astronomy.SearchMoonQuarter(now);
          // Find the next occurrence of each quarter
          let mq = result;
          let safety = 0;
          while (mq.quarter !== pq.quarter && safety < 8) {
            mq = Astronomy.NextMoonQuarter(mq);
            safety++;
          }
          if (mq.quarter === pq.quarter) {
            nextPhases.push({ name: pq.name, emoji: PHASE_EMOJIS[pq.name] || "🌑", date: mq.time.date });
          }
        } catch { /* skip */ }
      }
      nextPhases.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Special moon name detection
      let specialName: string | null = null;
      const isNearFull = moonPhase >= 170 && moonPhase <= 190;
      if (isNearFull) {
        const monthName = FULL_MOON_NAMES[now.getMonth()];
        specialName = monthName;

        // Check for supermoon/micromoon
        try {
          const geoMoon = Astronomy.GeoVector(Astronomy.Body.Moon, now, true);
          const distAU = Math.sqrt(geoMoon.x ** 2 + geoMoon.y ** 2 + geoMoon.z ** 2);
          const distKm = distAU * 149597870.7;
          const perigeeThreshold = 363300 * 1.10;
          const apogeeThreshold = 405500 * 0.90;
          if (distKm <= perigeeThreshold) specialName = `Super ${monthName}`;
          else if (distKm >= apogeeThreshold) specialName = `Micro ${monthName}`;
        } catch { /* skip */ }

        // Check for blue moon (second full moon in month)
        try {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const mq = Astronomy.SearchMoonQuarter(startOfMonth);
          let fullCount = 0;
          let check = mq;
          let safety = 0;
          while (check.time.date.getMonth() === now.getMonth() && safety < 5) {
            if (check.quarter === 2) fullCount++;
            check = Astronomy.NextMoonQuarter(check);
            safety++;
          }
          if (fullCount >= 2) specialName = `Blue Moon (${monthName})`;
        } catch { /* skip */ }
      }

      return { illumination, phaseName, moonPhase, culminationTime, culminationAlt, nextPhases, specialName };
    } catch {
      return null;
    }
  }, [date, lat, lng]);
}

const MoonPhaseCard = () => {
  const { date, location } = useObservation();
  const { data, isLoading } = useAstronomyData();
  const tz = location.timezone;
  const enhanced = useEnhancedMoon(date, location.lat, location.lng);

  const toLocal = (utc: string | null | undefined) => utc ? utcToLocal(utc, date, tz) : null;

  const localMoon = getMoonPhase(date);
  const phaseName = enhanced?.phaseName || data?.moon?.phase || localMoon.name;
  const illumination = enhanced?.illumination ?? data?.moon?.fracillum ?? localMoon.illumination;
  const moonrise = toLocal(data?.moon?.moonrise);
  const moonset = toLocal(data?.moon?.moonset);

  const isWaxing = phaseName.toLowerCase().includes("waxing") ||
    phaseName.toLowerCase().includes("first") ||
    phaseName.toLowerCase().includes("new") ||
    phaseName.toLowerCase().includes("croissant");
  const fraction = illumination / 100;

  const seeing = getSeeingImpact(illumination);

  const buildMoonPath = (frac: number, waxing: boolean) => {
    const r = 60;
    if (frac < 0.01) return "";
    if (frac > 0.99) return `M 0,-${r} A ${r},${r} 0 1,1 0,${r} A ${r},${r} 0 1,1 0,-${r} Z`;
    const cx = Math.abs(r * (2 * frac - 1));
    const largeArc = frac > 0.5 ? 1 : 0;
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
        <p className="text-sm text-muted-foreground">{illumination}% illuminated</p>
        {enhanced?.specialName && (
          <Badge variant="secondary" className="mt-1 text-xs">{enhanced.specialName}</Badge>
        )}
      </div>

      {/* Rise / Set times */}
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

      {/* Culmination */}
      {enhanced?.culminationTime && (
        <div className="w-full pt-3 border-t border-border space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>⬆ Culmination</span>
            <span className="font-mono text-foreground">{enhanced.culminationTime}</span>
          </div>
          {enhanced.culminationAlt !== null && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Max altitude</span>
              <span className="font-mono text-foreground">{enhanced.culminationAlt}°</span>
            </div>
          )}
        </div>
      )}

      {/* Seeing Impact */}
      <div className="w-full pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Deep-sky impact</span>
          <span className={`font-medium ${seeing.color}`}>{seeing.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{seeing.desc}</p>
      </div>

      {/* Next Phases Mini-Calendar */}
      {enhanced && enhanced.nextPhases.length > 0 && (
        <div className="w-full pt-3 border-t border-border space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upcoming phases</p>
          {enhanced.nextPhases.slice(0, 4).map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{p.emoji}</span>
              <span className="text-foreground/80">{p.name}</span>
              <span className="ml-auto font-mono text-foreground/60">
                {p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MoonPhaseCard;
