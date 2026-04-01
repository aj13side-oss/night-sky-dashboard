import { useMemo, useState, useEffect } from "react";
import { getAuroraForecast } from "@/lib/celestial-data";
import { getMoonPhase } from "@/lib/astronomy";
import { useObservation } from "@/contexts/ObservationContext";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ShowerRow {
  id: string;
  name: string;
  peak_month: number;
  peak_day_start: number;
  active_window_days: number;
  zhr: number;
  best_time: string | null;
}

const EventBanner = () => {
  const { date } = useObservation();
  const [dismissed, setDismissed] = useState<string | null>(() => {
    const key = `cosmicframe_dismiss_${date.toISOString().split("T")[0]}`;
    return localStorage.getItem(key);
  });
  const [showers, setShowers] = useState<ShowerRow[]>([]);

  useEffect(() => {
    (supabase as any).from("meteor_showers").select("id,name,peak_month,peak_day_start,active_window_days,zhr,best_time")
      .then(({ data }: any) => { if (data) setShowers(data); });
  }, []);

  const event = useMemo(() => {
    const now = date;
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentMonth = now.getMonth() + 1;

    for (const s of showers) {
      let year = now.getFullYear();
      if (s.peak_month < currentMonth - 2) year++;
      const peakMs = new Date(year, s.peak_month - 1, s.peak_day_start).getTime();
      const diff = Math.round((peakMs - todayMs) / 86400000);
      if (diff >= -1 && diff <= 3) {
        return {
          id: s.id,
          text: diff <= 0
            ? `☄️ ${s.name} meteor shower peaks tonight! ZHR ${s.zhr}. ${s.best_time ? `Best viewing ${s.best_time.toLowerCase()}.` : ""}`
            : `☄️ ${s.name} meteor shower peaks in ${diff} day${diff > 1 ? "s" : ""}! ZHR ${s.zhr}.`,
          type: "meteor",
        };
      }
    }

    const moon = getMoonPhase(now);
    const illum = moon.illumination;
    if (illum <= 10) return { id: "newmoon", text: "🌑 Near New Moon — perfect conditions for deep sky imaging tonight!", type: "moon" };
    if (illum >= 90) return { id: "fullmoon", text: "🌕 Near Full Moon — poor conditions for deep sky imaging. Try bright targets or narrowband filters.", type: "moon" };

    const aurora = getAuroraForecast();
    const highKp = aurora.find((a) => a.kpIndex >= 5);
    if (highKp) return { id: "aurora", text: `🌌 Geomagnetic storm alert! Kp ${highKp.kpIndex} — aurora possible at ${highKp.bestLatitude}.`, type: "aurora" };

    return null;
  }, [date, showers]);

  if (!event || dismissed === event.id) return null;

  const dismiss = () => {
    const key = `cosmicframe_dismiss_${date.toISOString().split("T")[0]}`;
    localStorage.setItem(key, event.id);
    setDismissed(event.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
        <p className="text-sm text-foreground flex-1">{event.text}</p>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventBanner;
