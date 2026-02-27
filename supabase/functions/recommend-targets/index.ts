import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { location, date, timeWindow, equipment, targetType, experience, moonTolerance } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
    
    const userPrompt = `Here's my setup for tonight:

**Location:** ${location || "Not specified"}
**Date:** ${date || "Tonight"}
**Available time window:** ${timeWindow || "All night"}
**Optics:** Focal length ${equipment?.focalLength || "?"}mm, Aperture ${equipment?.aperture || "?"}mm (f/${focalRatio})
**Camera sensor:** ${equipment?.pixelSize || "?"}µm pixel size, ${equipment?.sensorWidth || "?"}×${equipment?.sensorHeight || "?"}mm sensor
**Imaging type:** ${equipment?.imagingType === "narrowband" ? "Narrowband (Ha, OIII, SII)" : equipment?.imagingType === "both" ? "RGB and Narrowband" : "RGB / One-shot color"}
**Target preferences:** ${targetType || "Any"}
**Experience level:** ${experience || "Intermediate"}
**Moon tolerance:** ${moonTolerance || "Prefer dark skies"}

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
