import { useObservation } from "@/contexts/ObservationContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import React from "react";

interface OpenMeteoHour {
  time: string;
  temp: number;
  humidity: number;
  clouds: number;
  cloudsLow: number;
  cloudsMid: number;
  cloudsHigh: number;
  wind: number;
  dewPoint: number;
}

interface SevenTimerHour {
  time: string;
  clouds: number;
  seeing: string;
  transparency: string;
  wind: number | null;
  temp: number | null;
  humidity: number | null;
}

interface MetNorwayHour {
  time: string;
  temp: number | null;
  humidity: number | null;
  clouds: number | null;
  wind: number | null;
  dewPoint: number | null;
  fog: number | null;
}

interface MeteoSourceHour {
  time: string;
  temp: number | null;
  clouds: number | null;
  humidity: number | null;
  wind: number | null;
  visibility: number | null;
  precipitation: number | null;
}

interface WeatherResponse {
  openMeteo: OpenMeteoHour[];
  sevenTimer: SevenTimerHour[];
  metNorway: MetNorwayHour[];
  meteoSource: MeteoSourceHour[];
  timezone: string;
  errors: { openMeteo: string | null; sevenTimer: string | null; metNorway: string | null; meteoSource: string | null };
}

function filterNightHours<T extends { time: string }>(hours: T[], dateStr: string): T[] {
  const targetDate = dateStr.split("T")[0];
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDateStr = nextDay.toISOString().split("T")[0];
  return hours.filter((h) => {
    // Normalize time separator (MeteoBlue uses space, others use T)
    const normalized = h.time.replace(" ", "T");
    const hourNum = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "0");
    const day = normalized.split("T")[0];
    return (day === targetDate && hourNum >= 18) || (day === nextDateStr && hourNum <= 6);
  });
}

const formatHour = (time: string) => {
  const normalized = time.replace(" ", "T");
  const parts = normalized.split("T")[1];
  return parts ? parts.substring(0, 5) : time;
};

function cloudHeatmap(pct: number): string {
  if (pct <= 10) return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (pct <= 25) return "background-color: hsl(100, 50%, 32%); color: hsl(0, 0%, 100%);";
  if (pct <= 40) return "background-color: hsl(80, 45%, 35%); color: hsl(0, 0%, 100%);";
  if (pct <= 55) return "background-color: hsl(50, 60%, 38%); color: hsl(0, 0%, 100%);";
  if (pct <= 70) return "background-color: hsl(35, 70%, 38%); color: hsl(0, 0%, 100%);";
  if (pct <= 85) return "background-color: hsl(15, 65%, 35%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 60%, 32%); color: hsl(0, 0%, 100%);";
}

function tempHeatmap(temp: number): string {
  if (temp <= -5) return "background-color: hsl(220, 60%, 30%); color: hsl(0, 0%, 100%);";
  if (temp <= 0) return "background-color: hsl(210, 55%, 33%); color: hsl(0, 0%, 100%);";
  if (temp <= 5) return "background-color: hsl(195, 45%, 33%); color: hsl(0, 0%, 100%);";
  if (temp <= 10) return "background-color: hsl(170, 40%, 32%); color: hsl(0, 0%, 100%);";
  if (temp <= 15) return "background-color: hsl(120, 40%, 32%); color: hsl(0, 0%, 100%);";
  if (temp <= 20) return "background-color: hsl(80, 45%, 35%); color: hsl(0, 0%, 100%);";
  if (temp <= 25) return "background-color: hsl(45, 55%, 38%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(20, 60%, 35%); color: hsl(0, 0%, 100%);";
}

function humidityHeatmap(pct: number): string {
  if (pct <= 40) return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (pct <= 55) return "background-color: hsl(100, 45%, 32%); color: hsl(0, 0%, 100%);";
  if (pct <= 70) return "background-color: hsl(50, 55%, 36%); color: hsl(0, 0%, 100%);";
  if (pct <= 85) return "background-color: hsl(30, 65%, 36%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 55%, 32%); color: hsl(0, 0%, 100%);";
}

function windHeatmap(speed: number): string {
  if (speed <= 5) return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (speed <= 12) return "background-color: hsl(100, 45%, 32%); color: hsl(0, 0%, 100%);";
  if (speed <= 20) return "background-color: hsl(50, 55%, 36%); color: hsl(0, 0%, 100%);";
  if (speed <= 30) return "background-color: hsl(30, 65%, 36%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 55%, 32%); color: hsl(0, 0%, 100%);";
}

function seeingHeatmap(val: string): string {
  if (val === "Excellent") return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (val === "Good") return "background-color: hsl(80, 45%, 33%); color: hsl(0, 0%, 100%);";
  if (val === "Average") return "background-color: hsl(35, 65%, 36%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 55%, 32%); color: hsl(0, 0%, 100%);";
}

function visibilityHeatmap(km: number): string {
  if (km >= 20) return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (km >= 10) return "background-color: hsl(100, 45%, 32%); color: hsl(0, 0%, 100%);";
  if (km >= 5) return "background-color: hsl(50, 55%, 36%); color: hsl(0, 0%, 100%);";
  if (km >= 2) return "background-color: hsl(30, 65%, 36%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 55%, 32%); color: hsl(0, 0%, 100%);";
}

function precipHeatmap(mm: number): string {
  if (mm <= 0) return "background-color: hsl(120, 55%, 30%); color: hsl(0, 0%, 100%);";
  if (mm <= 0.5) return "background-color: hsl(50, 55%, 36%); color: hsl(0, 0%, 100%);";
  if (mm <= 2) return "background-color: hsl(30, 65%, 36%); color: hsl(0, 0%, 100%);";
  return "background-color: hsl(0, 55%, 32%); color: hsl(0, 0%, 100%);";
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function alignToHourlyGrid<R extends { time: string }, S extends { time: string }>(
  referenceHours: R[],
  sparseHours: S[]
): (S | null)[] {
  // Build a lookup by hour number (0-23)
  const lookup = new Map<number, S>();
  for (const h of sparseHours) {
    const hourNum = parseInt(formatHour(h.time).split(":")[0] ?? "0");
    lookup.set(hourNum, h);
  }
  // For each reference hour, find exact match or null
  return referenceHours.map((ref) => {
    const hourNum = parseInt(formatHour(ref.time).split(":")[0] ?? "0");
    return lookup.get(hourNum) || null;
  });
}

function computeGlobalScore(
  om: OpenMeteoHour[],
  st: SevenTimerHour[],
  mn: MetNorwayHour[],
  ms: MeteoSourceHour[]
): number | null {
  const scores: number[] = [];

  const cloudValues: number[] = [];
  om.forEach((h) => cloudValues.push(clamp(h.clouds)));
  mn.forEach((h) => { if (h.clouds != null) cloudValues.push(clamp(h.clouds)); });
  ms.forEach((h) => { if (h.clouds != null) cloudValues.push(clamp(h.clouds)); });
  st.forEach((h) => cloudValues.push(clamp(h.clouds)));

  if (cloudValues.length > 0) {
    const avgClouds = cloudValues.reduce((a, b) => a + b, 0) / cloudValues.length;
    scores.push(Math.max(0, 100 - avgClouds));
  }

  const seeingMap: Record<string, number> = { Excellent: 100, Good: 75, Average: 50, Poor: 25 };
  const seeingScores = st.map((h) => seeingMap[h.seeing] ?? 50);
  if (seeingScores.length > 0) {
    scores.push(seeingScores.reduce((a, b) => a + b, 0) / seeingScores.length);
  }

  const transpScores = st.map((h) => seeingMap[h.transparency] ?? 50);
  if (transpScores.length > 0) {
    scores.push(transpScores.reduce((a, b) => a + b, 0) / transpScores.length);
  }

  const windValues: number[] = [];
  om.forEach((h) => windValues.push(h.wind));
  mn.forEach((h) => { if (h.wind != null) windValues.push(h.wind); });
  if (windValues.length > 0) {
    const avgWind = windValues.reduce((a, b) => a + b, 0) / windValues.length;
    scores.push(clamp(100 - (avgWind / 30) * 100));
  }

  const humValues: number[] = [];
  om.forEach((h) => humValues.push(h.humidity));
  mn.forEach((h) => { if (h.humidity != null) humValues.push(h.humidity); });
  if (humValues.length > 0) {
    const avgHum = humValues.reduce((a, b) => a + b, 0) / humValues.length;
    scores.push(clamp(100 - avgHum));
  }

  if (scores.length === 0) return null;
  return Math.round(clamp(scores.reduce((a, b) => a + b, 0) / scores.length));
}

function scoreColor(score: number): string {
  if (score >= 70) return "hsl(120, 55%, 40%)";
  if (score >= 50) return "hsl(80, 50%, 40%)";
  if (score >= 35) return "hsl(40, 70%, 45%)";
  return "hsl(0, 60%, 40%)";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Average";
  if (score >= 25) return "Poor";
  return "Bad";
}

const ObservationScore = ({ score }: { score: number }) => {
  const color = scoreColor(score);
  const label = scoreLabel(score);

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-5">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(220, 20%, 15%)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">Observation Quality</div>
        <div className="text-xs font-medium mt-0.5" style={{ color }}>{label}</div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Combined score from clouds, seeing, transparency, wind & humidity across all 5 sources
        </div>
      </div>
    </div>
  );
};

const HourlyWeatherCard = () => {
  const { date, location } = useObservation();
  const dateStr = date.toISOString().split("T")[0];

  const { data, isLoading, error } = useQuery<WeatherResponse>({
    queryKey: ["weather", location.lat, location.lng, dateStr],
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

  const openMeteoNight = data ? filterNightHours(data.openMeteo, dateStr) : [];
  const sevenTimerNight = data ? filterNightHours(data.sevenTimer, dateStr) : [];
  const metNorwayNight = data ? filterNightHours(data.metNorway || [], dateStr) : [];
  const meteoSourceNight = data ? filterNightHours(data.meteoSource || [], dateStr) : [];
  const globalScore = computeGlobalScore(openMeteoNight, sevenTimerNight, metNorwayNight, meteoSourceNight);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!isLoading && !error && globalScore !== null && (
        <ObservationScore score={globalScore} />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Hourly Weather Comparison</h3>
          <p className="text-xs text-muted-foreground">18h → 06h · {location.name} · {data?.timezone || ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
          {!isLoading && !error && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          )}
          {error && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Error
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading weather data...
        </div>
      ) : error ? (
        <div className="text-sm text-destructive text-center py-8">Failed to load weather data.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
          <HeatmapTable
            title="Open-Meteo"
            color="hsl(210, 100%, 60%)"
            error={data?.errors.openMeteo}
            columns={[
              { key: "hour", label: "⏰", width: "w-12" },
              { key: "clouds", label: "☁️" },
              { key: "cloudsLow", label: "Low" },
              { key: "cloudsMid", label: "Mid" },
              { key: "cloudsHigh", label: "High" },
              { key: "temp", label: "°C" },
              { key: "humidity", label: "💧" },
              { key: "wind", label: "💨" },
              { key: "dewPoint", label: "Dew" },
            ]}
            rows={openMeteoNight.map((h) => ({
              hour: { value: formatHour(h.time), style: "" },
              clouds: { value: `${h.clouds}`, style: cloudHeatmap(h.clouds) },
              cloudsLow: { value: `${h.cloudsLow}`, style: cloudHeatmap(h.cloudsLow) },
              cloudsMid: { value: `${h.cloudsMid}`, style: cloudHeatmap(h.cloudsMid) },
              cloudsHigh: { value: `${h.cloudsHigh}`, style: cloudHeatmap(h.cloudsHigh) },
              temp: { value: `${Math.round(h.temp)}°`, style: tempHeatmap(h.temp) },
              humidity: { value: `${h.humidity}%`, style: humidityHeatmap(h.humidity) },
              wind: { value: `${Math.round(h.wind)}`, style: windHeatmap(h.wind) },
              dewPoint: { value: `${Math.round(h.dewPoint)}°`, style: tempHeatmap(h.dewPoint) },
            }))}
          />

          <HeatmapTable
            title="MET Norway (Yr)"
            color="hsl(150, 70%, 50%)"
            error={data?.errors.metNorway}
            columns={[
              { key: "hour", label: "⏰", width: "w-12" },
              { key: "clouds", label: "☁️" },
              { key: "temp", label: "°C" },
              { key: "humidity", label: "💧" },
              { key: "wind", label: "💨" },
              { key: "fog", label: "🌫️" },
            ]}
            rows={metNorwayNight.map((h) => ({
              hour: { value: formatHour(h.time), style: "" },
              clouds: { value: h.clouds != null ? `${Math.round(h.clouds)}` : "—", style: h.clouds != null ? cloudHeatmap(h.clouds) : "" },
              temp: { value: h.temp != null ? `${Math.round(h.temp)}°` : "—", style: h.temp != null ? tempHeatmap(h.temp) : "" },
              humidity: { value: h.humidity != null ? `${Math.round(h.humidity)}%` : "—", style: h.humidity != null ? humidityHeatmap(h.humidity) : "" },
              wind: { value: h.wind != null ? `${Math.round(h.wind)}` : "—", style: h.wind != null ? windHeatmap(h.wind) : "" },
              fog: { value: h.fog != null ? `${Math.round(h.fog)}%` : "—", style: h.fog != null ? cloudHeatmap(h.fog) : "" },
            }))}
          />

          <HeatmapTable
            title="MeteoSource"
            color="hsl(270, 70%, 60%)"
            error={data?.errors.meteoSource}
            columns={[
              { key: "hour", label: "⏰", width: "w-12" },
              { key: "clouds", label: "☁️" },
              { key: "temp", label: "°C" },
              { key: "humidity", label: "💧" },
              { key: "wind", label: "💨" },
              { key: "visibility", label: "👁️" },
              { key: "precip", label: "🌧️" },
            ]}
            rows={meteoSourceNight.map((h) => ({
              hour: { value: formatHour(h.time), style: "" },
              clouds: { value: h.clouds != null ? `${Math.round(h.clouds)}` : "—", style: h.clouds != null ? cloudHeatmap(h.clouds) : "" },
              temp: { value: h.temp != null ? `${Math.round(h.temp)}°` : "—", style: h.temp != null ? tempHeatmap(h.temp) : "" },
              humidity: { value: h.humidity != null ? `${Math.round(h.humidity)}%` : "—", style: h.humidity != null ? humidityHeatmap(h.humidity) : "" },
              wind: { value: h.wind != null ? `${Math.round(h.wind)}` : "—", style: h.wind != null ? windHeatmap(h.wind) : "" },
              visibility: { value: h.visibility != null ? `${h.visibility}` : "—", style: h.visibility != null ? visibilityHeatmap(h.visibility) : "" },
              precip: { value: h.precipitation != null ? `${h.precipitation}` : "—", style: h.precipitation != null ? precipHeatmap(h.precipitation) : "" },
            }))}
          />

          <HeatmapTable
            title="7Timer (Astro)"
            color="hsl(35, 100%, 60%)"
            error={data?.errors.sevenTimer}
            columns={[
              { key: "hour", label: "⏰", width: "w-12" },
              { key: "clouds", label: "☁️" },
              { key: "seeing", label: "Seeing" },
              { key: "transparency", label: "Transp." },
              { key: "temp", label: "°C" },
            ]}
            rows={alignToHourlyGrid(openMeteoNight, sevenTimerNight).map((h) => {
              if (!h) {
                return {
                  hour: { value: "", style: "" },
                  clouds: { value: "", style: "" },
                  seeing: { value: "", style: "" },
                  transparency: { value: "", style: "" },
                  temp: { value: "", style: "" },
                };
              }
              return {
                hour: { value: formatHour(h.time), style: "" },
                clouds: { value: `${h.clouds}`, style: cloudHeatmap(h.clouds) },
                seeing: { value: h.seeing, style: seeingHeatmap(h.seeing) },
                transparency: { value: h.transparency, style: seeingHeatmap(h.transparency) },
                temp: { value: h.temp != null ? `${h.temp}°` : "—", style: h.temp != null ? tempHeatmap(h.temp) : "" },
              };
            })}
          />

        </div>
      )}
    </motion.div>
  );
};

interface CellInfo {
  value: string;
  style: string;
}

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
}

interface HeatmapTableProps {
  title: string;
  color: string;
  error: string | null | undefined;
  columns: ColumnDef[];
  rows: Record<string, CellInfo>[];
}

const HeatmapTable = ({ title, color, error, columns, rows }: HeatmapTableProps) => (
  <div className="rounded-xl overflow-hidden border border-border/30" style={{ backgroundColor: "hsl(220, 30%, 8%)" }}>
    <div className="px-3 py-2 flex items-center gap-2 border-b border-border/30" style={{ backgroundColor: "hsl(220, 25%, 12%)" }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold text-foreground tracking-wide">{title}</span>
      {error && (
        <span className="text-[10px] text-destructive ml-auto flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      )}
    </div>

    {rows.length === 0 ? (
      <div className="text-[11px] text-muted-foreground text-center py-6">Pas de données nocturnes</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontSize: "11px" }}>
          <thead>
            <tr style={{ backgroundColor: "hsl(220, 25%, 14%)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-1.5 py-1.5 text-center font-semibold text-muted-foreground whitespace-nowrap border-b border-border/20 ${col.width || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/10 last:border-0">
                {columns.map((col) => {
                  const cell = row[col.key];
                  if (!cell) return <td key={col.key} />;
                  const isHour = col.key === "hour";
                  return (
                    <td
                      key={col.key}
                      className={`px-1.5 py-[5px] text-center font-mono tabular-nums whitespace-nowrap ${
                        isHour ? "font-semibold text-foreground" : ""
                      }`}
                      style={!isHour && cell.style ? cssStringToObject(cell.style) : undefined}
                    >
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

function cssStringToObject(css: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  css.split(";").forEach((pair) => {
    const [key, val] = pair.split(":").map((s) => s.trim());
    if (key && val) {
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      obj[camelKey] = val;
    }
  });
  return obj as unknown as React.CSSProperties;
}

export default HourlyWeatherCard;
