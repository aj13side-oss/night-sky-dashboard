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
  const data = useMemo(() => {
    const points = [];
    const baseDate = new Date(date);
    baseDate.setHours(12, 0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const d = new Date(baseDate.getTime() + h * 3600000);
      const alt = calculateAltitude(ra, dec, lat, lng, d);
      const hour = (12 + h) % 24;
      points.push({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        altitude: Math.round(alt * 10) / 10,
        isNight: hour >= 20 || hour <= 5,
      });
    }
    return points;
  }, [ra, dec, lat, lng, date]);

  return (
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
          <ReferenceLine y={30} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: "30° imaging", fill: "hsl(var(--accent))", fontSize: 9, position: "right" }} />
          <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" opacity={0.5} />
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
  );
};

export default AltitudeChart;
