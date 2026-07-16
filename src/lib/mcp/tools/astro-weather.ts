import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "astro_weather_forecast",
  title: "Astronomy weather forecast",
  description:
    "Astrophotography-oriented weather forecast for a location: hourly cloud cover (low/mid/high), temperature, humidity, dew point, and wind for the next ~48 hours. Powered by Open-Meteo (public data, no key).",
  inputSchema: {
    lat: z.number().min(-90).max(90).describe("Latitude in decimal degrees."),
    lng: z.number().min(-180).max(180).describe("Longitude in decimal degrees."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ lat, lng }) => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,dew_point_2m` +
      `&forecast_days=2&timezone=auto`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          content: [{ type: "text", text: `Open-Meteo error ${res.status}` }],
          isError: true,
        };
      }
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: { forecast: data },
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Fetch failed: ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
});
