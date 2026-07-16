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
  name: "get_celestial_object",
  title: "Get celestial object",
  description:
    "Fetch full details for one deep-sky object by its catalog id (e.g. 'M31', 'NGC 7000', 'IC 1396'). Includes photo score, moon tolerance, recommended filter, exposure guides, and best months.",
  inputSchema: {
    catalog_id: z.string().trim().min(1).describe("Catalog id such as 'M31', 'NGC 7000', 'IC 1396'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ catalog_id }) => {
    const { data, error } = await sb()
      .from("celestial_objects")
      .select("*")
      .ilike("catalog_id", catalog_id)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: `Lookup failed: ${error.message}` }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: `No object found for catalog id "${catalog_id}".` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { object: data },
    };
  },
});
