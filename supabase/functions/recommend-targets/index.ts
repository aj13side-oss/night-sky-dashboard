import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }


  try {
    const { location, date, timeWindow, equipment, targetType, experience, moonTolerance } = await req.json();

    if (typeof location !== "string" || location.trim().length === 0) {
      return new Response(JSON.stringify({ error: "location is required and must be a non-empty string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (equipment) {
      if (equipment.focalLength !== undefined && equipment.focalLength !== null) {
        const fl = parseFloat(equipment.focalLength);
        if (Number.isNaN(fl) || fl < 1 || fl > 10000) {
          return new Response(JSON.stringify({ error: "focalLength must be a number between 1 and 10000" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      if (equipment.aperture !== undefined && equipment.aperture !== null) {
        const ap = parseFloat(equipment.aperture);
        if (Number.isNaN(ap) || ap < 1 || ap > 2000) {
          return new Response(JSON.stringify({ error: "aperture must be a number between 1 and 2000" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI recommendations are temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert astrophotography advisor. Based on the astronomer's setup, location, date, and preferences, recommend exactly 3-4 celestial targets to photograph tonight.

For each target, provide:
- Name and catalog designation
- Type (galaxy, nebula, cluster, planet, etc.)
- Why it's a good choice for their setup
- Best time to observe tonight
- Suggested exposure settings (ISO, exposure time, number of subs)
- Framing tips

After the recommendations, write a short blog-style article (300-500 words) with practical tips for photographing these specific types of objects with their equipment. Include tips on:
- Focus techniques
- Framing and composition
- Processing workflow suggestions
- Common mistakes to avoid

Format your response in Markdown with clear headers. Use ## for target names and ### for the tips article title.`;

    const focalRatio = equipment?.aperture ? (parseFloat(equipment.focalLength) / parseFloat(equipment.aperture)).toFixed(1) : "N/A";
    
    const safeLocation = String(location).substring(0, 200);
    const safeDate = String(date || "").substring(0, 20);
    const safeTargetType = String(targetType || "").substring(0, 100);
    const safeExperience = String(experience || "").substring(0, 50);
    const safeMoonTolerance = String(moonTolerance || "").substring(0, 100);

    const userPrompt = `Here's my setup for tonight:

**Location:** ${safeLocation || "Not specified"}
**Date:** ${safeDate || "Tonight"}
**Available time window:** ${timeWindow || "All night"}
**Optics:** Focal length ${equipment?.focalLength || "?"}mm, Aperture ${equipment?.aperture || "?"}mm (f/${focalRatio})
**Camera sensor:** ${equipment?.pixelSize || "?"}µm pixel size, ${equipment?.sensorWidth || "?"}×${equipment?.sensorHeight || "?"}mm sensor
**Imaging type:** ${equipment?.imagingType === "narrowband" ? "Narrowband (Ha, OIII, SII)" : equipment?.imagingType === "both" ? "RGB and Narrowband" : "RGB / One-shot color"}
**Target preferences:** ${safeTargetType || "Any"}
**Experience level:** ${safeExperience || "Intermediate"}
**Moon tolerance:** ${safeMoonTolerance || "Prefer dark skies"}

What should I photograph tonight? Give me your best 3-4 targets and tips!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
