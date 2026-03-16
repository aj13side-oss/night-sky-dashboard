import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getMoonPhaseInfo } from "@/lib/moon-phase";
import { useObservation } from "@/contexts/ObservationContext";
import { motion } from "framer-motion";

function timeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  let h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  // Normalize: times after midnight (0-12) → add 24 for timeline continuity
  if (h < 12) h += 24;
  return h * 60 + m;
}

const TIMELINE_START = 18 * 60; // 18:00
const TIMELINE_END = 30 * 60;   // 06:00 next day
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

function pct(minutes: number | null): string {
  if (minutes === null) return "0%";
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, minutes));
  return `${((clamped - TIMELINE_START) / TIMELINE_SPAN) * 100}%`;
}

const TimelineBar = () => {
  const { data: astro } = useAstronomyData();
  const { date } = useObservation();
  const moon = getMoonPhaseInfo(date);

  if (!astro?.sun) return null;

  const sunset = timeToMinutes(astro.sun.sunset);
  const civilEnd = timeToMinutes(astro.sun.civilTwilightEnd);
  const astroEnd = timeToMinutes(astro.sun.astronomicalTwilightEnd);
  const astroBegin = timeToMinutes(astro.sun.astronomicalTwilightBegin);
  const civilBegin = timeToMinutes(astro.sun.civilTwilightBegin);
  const sunrise = timeToMinutes(astro.sun.sunrise);

  const moonrise = timeToMinutes(astro.moon?.moonrise);
  const moonset = timeToMinutes(astro.moon?.moonset);

  const hours = Array.from({ length: 13 }, (_, i) => {
    const h = (18 + i) % 24;
    return { label: `${String(h).padStart(2, "0")}:00`, mins: (18 + i) * 60 };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl p-4 space-y-2"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tonight's Timeline</h3>

      <div className="relative h-10 rounded-lg overflow-hidden bg-muted/30">
        {/* Civil twilight zones */}
        {sunset !== null && civilEnd !== null && (
          <div
            className="absolute top-0 bottom-0 opacity-60"
            style={{
              left: pct(sunset),
              width: `calc(${pct(civilEnd)} - ${pct(sunset)})`,
              background: "linear-gradient(90deg, hsl(220 60% 35%), hsl(230 50% 20%))",
            }}
          />
        )}
        {civilBegin !== null && sunrise !== null && (
          <div
            className="absolute top-0 bottom-0 opacity-60"
            style={{
              left: pct(civilBegin),
              width: `calc(${pct(sunrise)} - ${pct(civilBegin)})`,
              background: "linear-gradient(90deg, hsl(230 50% 20%), hsl(220 60% 35%))",
            }}
          />
        )}

        {/* Astronomical dark zone */}
        {astroEnd !== null && astroBegin !== null && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: pct(astroEnd),
              width: `calc(${pct(astroBegin)} - ${pct(astroEnd)})`,
              background: "hsl(230 30% 5%)",
            }}
          />
        )}

        {/* Moon above horizon */}
        {moon.illumination > 10 && moonrise !== null && moonset !== null && (
          <div
            className="absolute top-0 bottom-0 opacity-30"
            style={{
              left: pct(Math.min(moonrise, moonset)),
              width: `calc(${pct(Math.max(moonrise, moonset))} - ${pct(Math.min(moonrise, moonset))})`,
              background: "hsl(45 80% 50%)",
            }}
          />
        )}

        {/* Hour tick marks */}
        {hours.map((h) => (
          <div
            key={h.mins}
            className="absolute top-0 bottom-0 w-px bg-border/30"
            style={{ left: pct(h.mins) }}
          />
        ))}
      </div>

      {/* Hour labels */}
      <div className="relative h-4">
        {hours.filter((_, i) => i % 2 === 0).map((h) => (
          <span
            key={h.mins}
            className="absolute text-[9px] font-mono text-muted-foreground -translate-x-1/2"
            style={{ left: pct(h.mins) }}
          >
            {h.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: "hsl(220 60% 35%)" }} />
          Twilight
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: "hsl(230 30% 5%)" }} />
          Dark
        </span>
        {moon.illumination > 10 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm" style={{ background: "hsl(45 80% 50% / 0.4)" }} />
            Moon
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TimelineBar;
