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

  const angle = (illumination / 100) * 180;

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
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10 overflow-hidden">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(${angle}deg, 
                hsl(45 20% 85%) 0%, 
                hsl(45 20% 85%) 50%, 
                transparent 50%, 
                transparent 100%)`,
            }}
          />
          <div className="absolute w-4 h-4 rounded-full bg-muted-foreground/10 top-6 left-8" />
          <div className="absolute w-6 h-6 rounded-full bg-muted-foreground/10 top-14 left-4" />
          <div className="absolute w-3 h-3 rounded-full bg-muted-foreground/10 top-10 right-6" />
        </div>
        <div className="absolute -inset-3 rounded-full opacity-30"
          style={{ boxShadow: `0 0 40px 10px hsl(45 30% 70% / 0.2)` }} />
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
