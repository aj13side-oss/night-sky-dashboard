// ISS proxy — uses wheretheiss.at (reliable). open-notify.org is deprecated.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const unavailable = () =>
  json(
    { error: "iss_unavailable", detail: "Upstream ISS API is temporarily unavailable" },
    503,
  );

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getIssNow(): Promise<Response> {
  try {
    const r = await fetchWithTimeout("https://api.wheretheiss.at/v1/satellites/25544", 5000);
    if (!r.ok) {
      console.error("wheretheiss non-200:", r.status);
      return unavailable();
    }
    const d = await r.json();
    return json({
      message: "success",
      iss_position: {
        latitude: String(d.latitude),
        longitude: String(d.longitude),
      },
      altitude: d.altitude,
      velocity: d.velocity,
      timestamp: d.timestamp,
    });
  } catch (e) {
    console.error("wheretheiss failed:", e);
    return unavailable();
  }
}

async function getAstros(): Promise<Response> {
  // open-notify (only known free source) is unreliable; try with short timeout, else 503.
  try {
    const r = await fetchWithTimeout("http://api.open-notify.org/astros.json", 3000);
    if (!r.ok) return unavailable();
    return json(await r.json());
  } catch (e) {
    console.error("astros failed:", e);
    return unavailable();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (endpoint === "iss_now") return await getIssNow();
    if (endpoint === "astros") return await getAstros();

    return json({ error: "unknown endpoint" }, 400);
  } catch (e) {
    console.error("iss-proxy unhandled:", e);
    return unavailable();
  }
});
