import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MeteorShowerRow {
  id: string;
  name: string;
  description: string;
  peak_month: number;
  peak_day_start: number;
  peak_day_end: number;
  active_window_days: number;
  zhr: number;
  zhr_note: string | null;
  speed_km_s: number;
  parent_body: string | null;
  radiant_constellation: string | null;
  best_time: string | null;
  northern_hemisphere: boolean;
  southern_hemisphere: boolean;
}

export type ShowerStatus = "active" | "upcoming";

export interface MeteorShowerDisplay extends MeteorShowerRow {
  status: ShowerStatus;
  peakDate: Date;
  daysUntilStart: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatPeakRange(s: MeteorShowerRow): string {
  const m = MONTH_NAMES[s.peak_month - 1];
  return s.peak_day_start === s.peak_day_end
    ? `${m} ${s.peak_day_start}`
    : `${m} ${s.peak_day_start}–${s.peak_day_end}`;
}

export function useMeteorShowers() {
  const [showers, setShowers] = useState<MeteorShowerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await (supabase as any)
          .from("meteor_showers")
          .select("*");
        if (err || !data) { setError(true); setLoading(false); return; }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const in30 = todayMs + 30 * 86400000;
        const currentMonth = today.getMonth() + 1; // 1-indexed

        const results: MeteorShowerDisplay[] = [];

        for (const s of data as MeteorShowerRow[]) {
          // Determine which year to use for the peak
          let year = today.getFullYear();
          // If peak_month is more than 2 months behind current month, use next year
          if (s.peak_month < currentMonth - 2) {
            year++;
          }

          const peakDate = new Date(year, s.peak_month - 1, s.peak_day_start);
          const startMs = peakDate.getTime() - s.active_window_days * 86400000;
          const endMs = peakDate.getTime() + s.active_window_days * 86400000;

          if (todayMs >= startMs && todayMs <= endMs) {
            results.push({ ...s, status: "active", peakDate, daysUntilStart: 0 });
          } else if (todayMs < startMs && startMs <= in30) {
            const daysUntil = Math.round((startMs - todayMs) / 86400000);
            results.push({ ...s, status: "upcoming", peakDate, daysUntilStart: daysUntil });
          }
        }

        // Sort: active first, then by days until start
        results.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (b.status === "active" && a.status !== "active") return 1;
          return a.daysUntilStart - b.daysUntilStart;
        });

        setShowers(results);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { showers, loading, error };
}
