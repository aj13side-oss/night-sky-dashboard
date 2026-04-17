// ISS proxy with graceful fallback
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

async function fetchWithTimeout(url: string, ms = 4000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getIssNow() {
  // Primary: wheretheiss.at (HTTPS, reliable)
  try {
    const r = await fetchWithTimeout("https://api.wheretheiss.at/v1/satellites/25544", 4000);
    if (r.ok) {
      const d = await r.json();
      return {
        message: "success",
        iss_position: {
          latitude: String(d.latitude),
          longitude: String(d.longitude),
        },
        timestamp: d.timestamp,
      };
    }
  } catch (e) {
    console.error("wheretheiss failed:", e);
  }
  // Fallback: open-notify
  try {
    const r = await fetchWithTimeout("http://api.open-notify.org/iss-now.json", 4000);
    if (r.ok) return await r.json();
  } catch (e) {
    console.error("open-notify failed:", e);
  }
  return null;
}

async function getAstros() {
  try {
    const r = await fetchWithTimeout("http://api.open-notify.org/astros.json", 5000);
    if (r.ok) return await r.json();
  } catch (e) {
    console.error("astros failed:", e);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");

  if (endpoint === "iss_now") {
    const data = await getIssNow();
    if (data) return json(data);
    return json({ error: "ISS_NOW_UNAVAILABLE", fallback: true });
  }

  if (endpoint === "astros") {
    const data = await getAstros();
    if (data) return json(data);
    return json({ error: "ASTROS_UNAVAILABLE", fallback: true, people: [] });
  }

  return json({ error: "unknown endpoint" }, 400);
});
