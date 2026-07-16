import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function sb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "search_celestial_objects",
  title: "Search celestial objects",
  description:
    "Search the Cosmic Frame deep-sky catalog by name, common name, catalog id (e.g. 'M31', 'NGC 7000'), or constellation. Returns basic identity, position, magnitude, size, and type.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to search: catalog id, common name, or constellation."),
    limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const like = `%${query.replace(/[%_]/g, "\\$&")}%`;
    const { data, error } = await sb()
      .from("celestial_objects")
      .select(
        "catalog_id,common_name,constellation,obj_type,magnitude,size_max,ra,dec,scientific_notation",
      )
      .or(
        `catalog_id.ilike.${like},common_name.ilike.${like},constellation.ilike.${like},search_aliases.ilike.${like},scientific_notation.ilike.${like}`,
      )
      .order("magnitude", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      return { content: [{ type: "text", text: `Search failed: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
