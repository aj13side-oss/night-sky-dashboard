import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getSunTimes } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal, getTimezoneAbbr } from "@/lib/timezone";
import { Sunrise, Sunset, Sun, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SunTimesCard = () => {
  const { date, location } = useObservation();
  const { data, isLoading } = useAstronomyData();
  const tz = location.timezone;

  const localSun = getSunTimes(date, location.lat, location.lng);

  const toLocal = (utc: string | null | undefined) => utc ? utcToLocal(utc, date, tz) : null;

  const sunrise = toLocal(data?.sun?.sunrise) || localSun.sunrise;
  const sunset = toLocal(data?.sun?.sunset) || localSun.sunset;
  const solarNoon = toLocal(data?.sun?.solarNoon) || localSun.solarNoon;
  const astroTwilight = toLocal(data?.sun?.civilTwilightEnd) || localSun.astroTwilightEnd;

  const computeDayLength = () => {
    if (data?.sun?.sunrise && data?.sun?.sunset) {
      const [rh, rm] = data.sun.sunrise.split(":").map(Number);
      const [sh, sm] = data.sun.sunset.split(":").map(Number);
      let diff = (sh * 60 + sm) - (rh * 60 + rm);
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    return localSun.dayLength;
  };

  const tzAbbr = getTimezoneAbbr(date, tz);

  const items = [
    { icon: Sunrise, label: "Sunrise", value: sunrise, color: "text-primary" },
    { icon: Sun, label: "Solar Noon", value: solarNoon, color: "text-primary" },
    { icon: Sunset, label: "Sunset", value: sunset, color: "text-primary" },
    { icon: Star, label: "Civil Twilight End", value: astroTwilight, color: "text-accent" },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sun & Twilight</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{tzAbbr}</span>
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
          ) : data?.sun ? (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> USNO
            </span>
          ) : null}
        </div>
      </div>
      
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-sm text-secondary-foreground">{item.label}</span>
            </div>
            <span className="font-mono text-sm text-foreground">{item.value || "—"}</span>
          </motion.div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Day length</span>
          <span className="font-mono">{computeDayLength()}</span>
        </div>
      </div>
    </div>
  );
};

export default SunTimesCard;
