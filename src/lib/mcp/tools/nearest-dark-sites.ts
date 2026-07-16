import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DARK_SITES, distanceKm } from "../../dark-sites";

export default defineTool({
  name: "nearest_dark_sites",
  title: "Nearest dark sites",
  description:
    "Return the closest low-light-pollution observing sites (IDA Dark Sky Parks/Reserves and other curated sites) to a given latitude/longitude, sorted by distance.",
  inputSchema: {
    lat: z.number().min(-90).max(90).describe("Observer latitude in decimal degrees."),
    lng: z.number().min(-180).max(180).describe("Observer longitude in decimal degrees."),
    limit: z.number().int().min(1).max(20).default(5).describe("Max sites to return (1-20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ lat, lng, limit }) => {
    const results = DARK_SITES
      .map((s) => ({ ...s, distance_km: Math.round(distanceKm(lat, lng, s.lat, s.lng)) }))
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { sites: results },
    };
  },
});
