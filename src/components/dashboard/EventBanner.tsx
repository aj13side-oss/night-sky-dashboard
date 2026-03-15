import { useMemo, useState } from "react";
import { getMeteorShowers, getAuroraForecast } from "@/lib/celestial-data";
import { useObservation } from "@/contexts/ObservationContext";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getMonthDay(dateStr: string): { month: number; day: number } | null {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const match = dateStr.match(/([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const m = months[match[1].toLowerCase().slice(0, 3)];
  return m != null ? { month: m, day: parseInt(match[2]) } : null;
}

function daysBetween(d1: Date, m: number, day: number): number {
  const target = new Date(d1.getFullYear(), m, day);
  return Math.round((target.getTime() - d1.getTime()) / 86400000);
}

const EventBanner = () => {
  const { date } = useObservation();
  const [dismissed, setDismissed] = useState<string | null>(() => {
    const key = `cosmicframe_dismiss_${date.toISOString().split("T")[0]}`;
    return localStorage.getItem(key);
  });

  const event = useMemo(() => {
    const now = date;
    const month = now.getMonth();

    // Check meteor showers within 3 days
    const showers = getMeteorShowers();
    for (const s of showers) {
      const peak = getMonthDay(s.peakDate);
      if (peak) {
        const diff = daysBetween(now, peak.month, peak.day);
        if (diff >= -1 && diff <= 3) {
          return {
            id: s.id,
            text: diff <= 0
              ? `☄️ ${s.name} meteor shower peaks tonight! ZHR ${s.zhr}. Best viewing after midnight.`
              : `☄️ ${s.name} meteor shower peaks in ${diff} day${diff > 1 ? "s" : ""}! ZHR ${s.zhr}.`,
            type: "meteor",
          };
        }
      }
    }

    // New moon check (approximate: illumination < 5%)
    // We don't have live moon data here, so check day of month roughly
    // Simplified: offer a generic deep-sky tip around new moon dates
    const dayOfMonth = now.getDate();
    if (dayOfMonth >= 28 || dayOfMonth <= 2) {
      return {
        id: "newmoon",
        text: "🌑 Near New Moon — perfect conditions for deep sky imaging tonight!",
        type: "moon",
      };
    }

    // Aurora check
    const aurora = getAuroraForecast();
    const highKp = aurora.find((a) => a.kpIndex >= 5);
    if (highKp) {
      return {
        id: "aurora",
        text: `🌌 Geomagnetic storm alert! Kp ${highKp.kpIndex} — aurora possible at ${highKp.bestLatitude}.`,
        type: "aurora",
      };
    }

    return null;
  }, [date]);

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
