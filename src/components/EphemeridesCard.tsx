import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getPlanetEphemerides } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal, getTimezoneAbbr } from "@/lib/timezone";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const planetEmoji: Record<string, string> = {
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
};

const EphemeridesCard = () => {
  const { date, location } = useObservation();
  const { data, isLoading } = useAstronomyData();
  const localPlanets = getPlanetEphemerides(date);
  const hasLive = !!data?.planets;
  const tz = location.timezone;

  const toLocal = (utc: string | null | undefined) => utc ? utcToLocal(utc, date, tz) : null;
  const tzAbbr = getTimezoneAbbr(date, tz);

  const planets = localPlanets.map((p) => {
    const key = p.name.toLowerCase();
    const live = data?.planets?.[key];
    return {
      ...p,
      riseTime: toLocal(live?.rise) || p.riseTime,
      setTime: toLocal(live?.set) || p.setTime,
      transit: toLocal(live?.transit) || null,
      magnitude: live?.magnitude ?? p.magnitude,
      constellation: live?.constellation || p.constellation,
    };
  });

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Planetary Ephemerides</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{tzAbbr}</span>
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
          ) : hasLive ? (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left py-2 font-medium w-[20%]">Planet</th>
              <th className="text-left py-2 font-medium w-[20%]">Constellation</th>
              <th className="text-right py-2 font-medium w-[12%]">Mag</th>
              <th className="text-right py-2 font-medium w-[16%]">Rise</th>
              <th className="text-right py-2 font-medium w-[16%]">Transit</th>
              <th className="text-right py-2 font-medium w-[16%]">Set</th>
            </tr>
          </thead>
          <tbody>
            {planets.map((planet, i) => (
              <motion.tr
                key={planet.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-3">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{planetEmoji[planet.name]}</span>
                    <span className="text-foreground font-medium">{planet.name}</span>
                  </span>
                </td>
                <td className="py-3 text-secondary-foreground">{planet.constellation}</td>
                <td className="py-3 text-right font-mono text-muted-foreground">{planet.magnitude}</td>
                <td className="py-3 text-right font-mono text-muted-foreground">{planet.riseTime || "—"}</td>
                <td className="py-3 text-right font-mono text-foreground font-semibold">{planet.transit || "—"}</td>
                <td className="py-3 text-right font-mono text-muted-foreground">{planet.setTime || "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EphemeridesCard;
