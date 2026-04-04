import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";

interface SkyEvent {
  id: string;
  title: string;
  event_date: string;
  event_time_utc: string | null;
  event_type: string;
  description: string | null;
  source_name: string | null;
  visibility: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  moon_phase: "🌙",
  eclipse: "🌑",
  planet_conjunction: "🪐",
  planet_opposition: "🔭",
  planet_elongation: "✨",
  comet: "☄️",
  aurora_alert: "🌌",
  meteor_outburst: "🌠",
  occultation: "🌕",
  solstice_equinox: "☀️",
};

const VIS_COLORS: Record<string, string> = {
  excellent: "bg-green-600/20 text-green-400 border-green-500/30",
  good: "bg-teal-600/20 text-teal-400 border-teal-500/30",
  moderate: "bg-amber-600/20 text-amber-400 border-amber-500/30",
  poor: "bg-red-600/20 text-red-400 border-red-500/30",
};

const SkyEvents = () => {
  const [events, setEvents] = useState<SkyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const futureStr = format(addDays(today, 30), "yyyy-MM-dd");

    supabase
      .from("astronomical_events" as any)
      .select("id, title, event_date, event_time_utc, event_type, description, source_name, visibility")
      .gte("event_date", todayStr)
      .lte("event_date", futureStr)
      .neq("source_name", "NOAA Space Weather")
      .order("event_date", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setEvents((data as SkyEvent[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-semibold text-foreground mb-4">🔭 Sky Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-border/30">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>
    );
  }

  if (events.length === 0) {
    return (
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold text-foreground mb-4">🔭 Sky Events</h2>
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No upcoming sky events in the next 30 days
          </CardContent>
        </Card>
      </motion.section>
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-semibold text-foreground mb-4">🔭 Sky Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => {
          const icon = TYPE_ICONS[ev.event_type] ?? "🚀";
          const desc = ev.description && ev.description.length > 120
            ? ev.description.slice(0, 117) + "…"
            : ev.description;
          const visClass = ev.visibility ? VIS_COLORS[ev.visibility.toLowerCase()] : null;

          return (
            <Card key={ev.id} className="glass-card border-border/30">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">{icon}</span>
                  <h3 className="text-sm font-medium text-foreground leading-tight">{ev.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ev.event_date + "T00:00:00"), "MMM d")}
                  </span>
                  {ev.event_time_utc && (
                    <span className="text-xs text-muted-foreground">{ev.event_time_utc} UTC</span>
                  )}
                  {visClass && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${visClass}`}>
                      {ev.visibility}
                    </Badge>
                  )}
                </div>
                {desc && <p className="text-xs text-muted-foreground/80 leading-relaxed">{desc}</p>}
                {ev.source_name && (
                  <p className="text-[10px] text-muted-foreground/50">{ev.source_name}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.section>
  );
};

export default SkyEvents;
