import { useObservation } from "@/contexts/ObservationContext";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Cloud, CloudRain, Sun } from "lucide-react";
import { motion } from "framer-motion";

interface WeatherHour {
  time: string;
  temp: number;
  humidity: number;
  clouds: number;
  wind: number;
}

function cloudIcon(pct: number) {
  if (pct <= 25) return <Sun className="w-4 h-4 text-primary" />;
  if (pct <= 60) return <Cloud className="w-4 h-4 text-muted-foreground" />;
  return <CloudRain className="w-4 h-4 text-destructive" />;
}

function qualityDot(clouds: number): string {
  if (clouds <= 20) return "bg-green-400";
  if (clouds <= 50) return "bg-primary";
  if (clouds <= 75) return "bg-orange-400";
  return "bg-destructive";
}

const WeatherTimeline = () => {
  const { date, location } = useObservation();
  const dateStr = date.toISOString().split("T")[0];

  const { data, isLoading } = useQuery({
    queryKey: ["weather-tonight", location.lat, location.lng, dateStr],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ lat: location.lat, lng: location.lng, date: dateStr }),
        }
      );
      if (!res.ok) throw new Error("Weather fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter night hours from openMeteo
  const nightHours: WeatherHour[] = (data?.openMeteo ?? []).filter((h: any) => {
    const normalized = h.time.replace(" ", "T");
    const hourNum = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "0");
    const day = normalized.split("T")[0];
    const nextDay = new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = nextDay.toISOString().split("T")[0];
    return (day === dateStr && hourNum >= 18) || (day === nextDateStr && hourNum <= 6);
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 flex items-center justify-center min-h-[100px]">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (nightHours.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-xl p-4 space-y-3"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weather Tonight</h3>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {nightHours.map((h: any, i: number) => {
            const hour = h.time.replace(" ", "T").split("T")[1]?.substring(0, 5) ?? "";
            return (
              <div key={i} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-secondary/30 min-w-[52px]">
                <span className="text-[9px] font-mono text-muted-foreground">{hour}</span>
                {cloudIcon(h.clouds)}
                <span className="text-[10px] font-mono text-foreground">{Math.round(h.temp)}°</span>
                <span className="text-[9px] text-muted-foreground">{h.humidity}%</span>
                <div className={`w-2 h-2 rounded-full ${qualityDot(h.clouds)}`} />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherTimeline;
