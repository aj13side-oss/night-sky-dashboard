import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getSunTimes } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal, getTimezoneAbbr } from "@/lib/timezone";
import { Sunrise, Sunset, Sun, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const SunTimesCard = () => {
  const { date, location } = useObservation();
  const { data, isLoading } = useAstronomyData();
  const tz = location.timezone;
  const [showInfo, setShowInfo] = useState(false);

  const localSun = getSunTimes(date, location.lat, location.lng);

  const toLocal = (utc: string | null | undefined) => utc ? utcToLocal(utc, date, tz) : null;

  const sunrise = toLocal(data?.sun?.sunrise) || localSun.sunrise;
  const sunset = toLocal(data?.sun?.sunset) || localSun.sunset;
  const solarNoon = toLocal(data?.sun?.solarNoon) || localSun.solarNoon;

  const civilBegin = toLocal(data?.sun?.civilTwilightBegin);
  const civilEnd = toLocal(data?.sun?.civilTwilightEnd);
  const nauticalBegin = toLocal(data?.sun?.nauticalTwilightBegin);
  const nauticalEnd = toLocal(data?.sun?.nauticalTwilightEnd);
  const astroBegin = toLocal(data?.sun?.astronomicalTwilightBegin);
  const astroEnd = toLocal(data?.sun?.astronomicalTwilightEnd);

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

  const twilightSections = [
    {
      label: "Civil",
      begin: civilBegin,
      end: civilEnd,
      color: "bg-amber-400/80",
      desc: "Sun is 0–6° below the horizon. Enough light for outdoor activities without artificial lighting.",
    },
    {
      label: "Nautical",
      begin: nauticalBegin,
      end: nauticalEnd,
      color: "bg-blue-400/70",
      desc: "Sun is 6–12° below. Horizon still visible at sea; bright stars & planets appear.",
    },
    {
      label: "Astronomical",
      begin: astroBegin,
      end: astroEnd,
      color: "bg-indigo-500/70",
      desc: "Sun is 12–18° below. Sky is dark enough for deep-sky astrophotography — the golden window.",
    },
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

      {/* Sun core times */}
      <div className="space-y-3">
        {[
          { icon: Sunrise, label: "Sunrise", value: sunrise, color: "text-primary" },
          { icon: Sun, label: "Solar Noon", value: solarNoon, color: "text-primary" },
          { icon: Sunset, label: "Sunset", value: sunset, color: "text-primary" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
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

      {/* Twilight table */}
      <div className="pt-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Twilight phases</span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-secondary/50 border border-border p-3 space-y-2 text-xs text-muted-foreground"
          >
            {twilightSections.map((t) => (
              <div key={t.label} className="flex gap-2">
                <span className={`w-2 h-2 rounded-full ${t.color} mt-1 shrink-0`} />
                <div>
                  <span className="font-medium text-foreground">{t.label}:</span> {t.desc}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-xs text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground text-center uppercase">Begin</span>
          <span className="text-[10px] text-muted-foreground text-center uppercase">End</span>

          {twilightSections.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="contents"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${t.color}`} />
                <span className="text-secondary-foreground text-sm">{t.label}</span>
              </div>
              <span className="font-mono text-sm text-foreground text-center">{t.begin || "—"}</span>
              <span className="font-mono text-sm text-foreground text-center">{t.end || "—"}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Day length */}
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
