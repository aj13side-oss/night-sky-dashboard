import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from "recharts";
import { calculateAltitude } from "@/lib/visibility";

interface Props {
  ra: number;
  dec: number;
  lat: number;
  lng: number;
  date?: Date;
}

const AltitudeChart = ({ ra, dec, lat, lng, date = new Date() }: Props) => {
  const { data, transitPoint, bestWindow } = useMemo(() => {
    const points: { hour: string; altitude: number; isNight: boolean }[] = [];
    const baseDate = new Date(date);
    baseDate.setHours(12, 0, 0, 0);

    let maxAlt = -999;
    let maxHour = "";
    let maxTime: Date | null = null;
    let windowStart: string | null = null;
    let windowEnd: string | null = null;
    let prevAlt = -999;
    let riseHour: string | null = null;
    let setHour: string | null = null;

    for (let h = 0; h < 24; h++) {
      const d = new Date(baseDate.getTime() + h * 3600000);
      const alt = calculateAltitude(ra, dec, lat, lng, d);
      const hour = (12 + h) % 24;
      const hourStr = `${hour.toString().padStart(2, "0")}:00`;

      if (alt > maxAlt) {
        maxAlt = alt;
        maxHour = hourStr;
        maxTime = d;
      }

      // Rise detection
      if (prevAlt <= 0 && alt > 0 && !riseHour) riseHour = hourStr;
      // Set detection
      if (prevAlt > 0 && alt <= 0) setHour = hourStr;

      // Best window (>30°)
      if (alt >= 30 && !windowStart) windowStart = hourStr;
      if (prevAlt >= 30 && alt < 30 && windowStart) windowEnd = hourStr;

      prevAlt = alt;
      points.push({
        hour: hourStr,
        altitude: Math.round(alt * 10) / 10,
        isNight: hour >= 20 || hour <= 5,
      });
    }

    if (windowStart && !windowEnd) windowEnd = points[points.length - 1].hour;

    const neverRises = points.every((p) => p.altitude <= 0);
    const circumpolar = points.every((p) => p.altitude > 0);

    let label = "";
    if (neverRises) {
      label = "Not visible tonight";
    } else if (circumpolar && windowStart) {
      label = "Circumpolar — visible all night";
    } else if (windowStart && windowEnd) {
      label = `Best window: ${windowStart} — ${windowEnd} (above 30°)`;
    } else if (riseHour || setHour) {
      label = `Visible but below 30° — peak ${maxAlt.toFixed(0)}° at ${maxHour}`;
    } else {
      label = "Limited visibility";
    }

    return {
      data: points,
      transitPoint: { hour: maxHour, alt: maxAlt },
      bestWindow: label,
    };
  }, [ra, dec, lat, lng, date]);

  const today = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Altitude Tonight — {today}
        </h4>
        <span className="text-[10px] font-mono text-primary">
          Transit: {transitPoint.hour} ({transitPoint.alt.toFixed(0)}°)
        </span>
      </div>

      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              domain={[-10, 90]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              tickFormatter={(v) => `${v}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(val: number) => [`${val}°`, "Altitude"]}
            />
            <ReferenceLine
              y={30}
              stroke="hsl(var(--accent))"
              strokeDasharray="5 5"
              label={{ value: "Good imaging (>30°)", fill: "hsl(var(--accent))", fontSize: 9, position: "right" }}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{ value: "Horizon", fill: "hsl(var(--destructive))", fontSize: 9, position: "right" }}
            />
            <Area
              type="monotone"
              dataKey="altitude"
              stroke="hsl(var(--primary))"
              fill="url(#altGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground">{bestWindow}</p>
    </div>
  );
};

export default AltitudeChart;
