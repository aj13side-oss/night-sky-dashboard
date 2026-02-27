import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function seeingLabel(val: number): string {
  if (val <= 2) return "Excellent";
  if (val <= 4) return "Good";
  if (val <= 6) return "Average";
  return "Poor";
}

function transparencyLabel(val: number): string {
  if (val <= 2) return "Excellent";
  if (val <= 4) return "Good";
  if (val <= 6) return "Average";
  return "Poor";
}

function cloudPct(val: number): number {
  return Math.round(((val - 1) / 8) * 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng, date } = await req.json();

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "lat and lng are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meteoSourceKey = Deno.env.get("METEOSOURCE_API_KEY");

    const fetches: Promise<Response>[] = [
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,dew_point_2m&forecast_days=2&timezone=auto`
      ),
      fetch(
        `https://www.7timer.info/bin/api.pl?lon=${lng}&lat=${lat}&product=astro&output=json`
      ),
      fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "AstroDash/1.0 github.com/astrodash" } }
      ),
    ];

    if (meteoSourceKey) {
      fetches.push(
        fetch(
          `https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lng}&sections=hourly&timezone=UTC&units=metric&key=${meteoSourceKey}`
        )
      );
    }

    const results = await Promise.allSettled(fetches);
    const [openMeteoRes, sevenTimerRes, metNorwayRes] = results;
    const meteoSourceRes = results[3] || { status: "rejected" as const, reason: "No API key" };

    let openMeteo: any = null;
    if (openMeteoRes.status === "fulfilled" && openMeteoRes.value.ok) {
      openMeteo = await openMeteoRes.value.json();
    }

    let sevenTimer: any = null;
    if (sevenTimerRes.status === "fulfilled" && sevenTimerRes.value.ok) {
      const text = await sevenTimerRes.value.text();
      try {
        sevenTimer = JSON.parse(text);
      } catch {
        console.error("7Timer parse error:", text.substring(0, 200));
      }
    }

    let metNorway: any = null;
    if (metNorwayRes.status === "fulfilled" && metNorwayRes.value.ok) {
      metNorway = await metNorwayRes.value.json();
    }

    let meteoSource: any = null;
    if (meteoSourceRes.status === "fulfilled" && meteoSourceRes.value.ok) {
      meteoSource = await meteoSourceRes.value.json();
    }

    const openMeteoHours: any[] = [];
    if (openMeteo?.hourly) {
      const h = openMeteo.hourly;
      for (let i = 0; i < h.time.length; i++) {
        openMeteoHours.push({
          time: h.time[i],
          temp: h.temperature_2m[i],
          humidity: h.relative_humidity_2m[i],
          clouds: h.cloud_cover[i],
          cloudsLow: h.cloud_cover_low[i],
          cloudsMid: h.cloud_cover_mid[i],
          cloudsHigh: h.cloud_cover_high[i],
          wind: h.wind_speed_10m[i],
          dewPoint: h.dew_point_2m[i],
        });
      }
    }

    const sevenTimerHours: any[] = [];
    if (sevenTimer?.dataseries) {
      const initStr = sevenTimer.init;
      const initYear = parseInt(initStr.substring(0, 4));
      const initMonth = parseInt(initStr.substring(4, 6)) - 1;
      const initDay = parseInt(initStr.substring(6, 8));
      const initHour = parseInt(initStr.substring(8, 10));
      const initDate = new Date(Date.UTC(initYear, initMonth, initDay, initHour));

      for (const dp of sevenTimer.dataseries) {
        const forecastTime = new Date(initDate.getTime() + dp.timepoint * 3600000);
        sevenTimerHours.push({
          time: forecastTime.toISOString().substring(0, 16),
          clouds: cloudPct(dp.cloudcover),
          seeing: seeingLabel(dp.seeing),
          transparency: transparencyLabel(dp.transparency),
          wind: dp.wind10m?.speed ?? null,
          temp: dp.temp2m ?? null,
          humidity: dp.rh2m ?? null,
        });
      }
    }

    const metNorwayHours: any[] = [];
    if (metNorway?.properties?.timeseries) {
      for (const ts of metNorway.properties.timeseries) {
        const details = ts.data?.instant?.details;
        if (!details) continue;
        metNorwayHours.push({
          time: ts.time.substring(0, 16),
          temp: details.air_temperature ?? null,
          humidity: details.relative_humidity ?? null,
          clouds: details.cloud_area_fraction ?? null,
          wind: details.wind_speed ?? null,
          dewPoint: details.dew_point_temperature ?? null,
          fog: details.fog_area_fraction ?? null,
        });
      }
    }

    const meteoSourceHours: any[] = [];
    if (meteoSource?.hourly?.data) {
      for (const h of meteoSource.hourly.data) {
        meteoSourceHours.push({
          time: h.date ? h.date.substring(0, 16) : "",
          temp: h.temperature ?? null,
          clouds: h.cloud_cover?.total ?? null,
          humidity: h.humidity ?? null,
          wind: h.wind?.speed ?? null,
          visibility: h.visibility ?? null,
          precipitation: h.precipitation?.total ?? null,
        });
      }
    }

    return new Response(
      JSON.stringify({
        openMeteo: openMeteoHours,
        sevenTimer: sevenTimerHours,
        metNorway: metNorwayHours,
        meteoSource: meteoSourceHours,
        timezone: openMeteo?.timezone || "UTC",
        errors: {
          openMeteo: openMeteoRes.status === "rejected" ? "Failed to fetch" : null,
          sevenTimer: sevenTimerRes.status === "rejected" ? "Failed to fetch" : null,
          metNorway: metNorwayRes.status === "rejected" ? "Failed to fetch" : null,
          meteoSource: !meteoSourceKey ? "No API key" : meteoSourceRes.status === "rejected" ? "Failed to fetch" : (meteoSourceRes.status === "fulfilled" && !meteoSourceRes.value.ok) ? `HTTP ${meteoSourceRes.value.status}` : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("weather error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
