import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as Astronomy from "https://esm.sh/astronomy-engine@2.1.19";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLANET_BODIES: { key: string; body: Astronomy.Body }[] = [
  { key: "mercury", body: Astronomy.Body.Mercury },
  { key: "venus", body: Astronomy.Body.Venus },
  { key: "mars", body: Astronomy.Body.Mars },
  { key: "jupiter", body: Astronomy.Body.Jupiter },
  { key: "saturn", body: Astronomy.Body.Saturn },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng, date } = await req.json();
    if (!lat || !lng || !date) {
      return new Response(JSON.stringify({ error: "lat, lng, and date are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coords = `${lat},${lng}`;
    const observer = new Astronomy.Observer(lat, lng, 0);
    const dateObj = new Date(`${date}T12:00:00Z`);

    const [sunMoonRes, moonPhasesRes] = await Promise.allSettled([
      fetch(`https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${coords}`),
      fetch(`https://aa.usno.navy.mil/api/moon/phases/date?date=${date}&nump=4`),
    ]);

    let sunMoonData: any = null;
    if (sunMoonRes.status === "fulfilled" && sunMoonRes.value.ok) {
      sunMoonData = await sunMoonRes.value.json();
    }

    let moonPhasesData: any = null;
    if (moonPhasesRes.status === "fulfilled" && moonPhasesRes.value.ok) {
      moonPhasesData = await moonPhasesRes.value.json();
    }

    const planets: Record<string, any> = {};
    for (const { key, body } of PLANET_BODIES) {
      try {
        const rise = Astronomy.SearchRiseSet(body, observer, +1, dateObj, 1);
        const set = Astronomy.SearchRiseSet(body, observer, -1, dateObj, 1);
        const transit = Astronomy.SearchHourAngle(body, observer, 0, dateObj, 1);
        const eqj = Astronomy.Equator(body, dateObj, observer, true, true);

        let magnitude: number | null = null;
        try {
          const illum = Astronomy.Illumination(body, dateObj);
          magnitude = Math.round(illum.mag * 100) / 100;
        } catch (_) {}

        planets[key] = {
          rise: rise ? formatUtcTime(rise.date) : null,
          set: set ? formatUtcTime(set.date) : null,
          transit: transit ? formatUtcTime(transit.time.date) : null,
          transitAlt: transit ? Math.round(transit.hor.altitude * 10) / 10 : null,
          ra: Math.round(eqj.ra * 1000) / 1000,
          dec: Math.round(eqj.dec * 100) / 100,
          magnitude,
          constellation: raDecToConstellation(eqj.ra, eqj.dec),
        };
      } catch (e) {
        console.error(`Error computing ${key}:`, e);
      }
    }

    const d = sunMoonData?.properties?.data;

    const sun = d?.sundata ? {
      sunrise: findPhen(d.sundata, "Rise"),
      sunset: findPhen(d.sundata, "Set"),
      solarNoon: findPhen(d.sundata, "Upper Transit"),
      civilTwilightBegin: findPhen(d.sundata, "Begin Civil Twilight"),
      civilTwilightEnd: findPhen(d.sundata, "End Civil Twilight"),
      nauticalTwilightBegin: findPhen(d.sundata, "Begin Nautical Twilight"),
      nauticalTwilightEnd: findPhen(d.sundata, "End Nautical Twilight"),
      astronomicalTwilightBegin: findPhen(d.sundata, "Begin Astronomical Twilight"),
      astronomicalTwilightEnd: findPhen(d.sundata, "End Astronomical Twilight"),
    } : null;

    const moon = d ? {
      phase: d.curphase || null,
      fracillum: d.fracillum ? parseFloat(String(d.fracillum).replace("%", "")) : null,
      moonrise: findPhen(d.moondata, "Rise"),
      moonset: findPhen(d.moondata, "Set"),
      transit: findPhen(d.moondata, "Upper Transit"),
      closestPhase: d.closestphase || null,
    } : null;

    return new Response(
      JSON.stringify({
        sun,
        moon,
        moonPhases: moonPhasesData?.phasedata || null,
        planets: Object.keys(planets).length > 0 ? planets : null,
        error: sunMoonRes.status === "rejected" ? "USNO unavailable" : (!sunMoonData ? "Parse error" : null),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("astronomy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function findPhen(data: any[], phen: string): string | null {
  if (!Array.isArray(data)) return null;
  const entry = data.find((d: any) => d.phen === phen);
  return entry?.time || null;
}

function formatUtcTime(d: Date): string {
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function raDecToConstellation(raHours: number, decDeg: number): string {
  const ra = raHours;
  if (decDeg > 60) return "Ursa Major";
  if (decDeg < -60) return "Centaurus";
  if (ra < 1.5) return "Pisces";
  if (ra < 3.5) return "Aries";
  if (ra < 5.5) return "Taurus";
  if (ra < 7) return "Gemini";
  if (ra < 8.5) return "Cancer";
  if (ra < 10.5) return "Leo";
  if (ra < 12.5) return "Virgo";
  if (ra < 14.5) return "Libra";
  if (ra < 16) return "Scorpius";
  if (ra < 17.5) return "Ophiuchus";
  if (ra < 19) return "Sagittarius";
  if (ra < 20.5) return "Capricornus";
  if (ra < 22) return "Aquarius";
  return "Pisces";
}
