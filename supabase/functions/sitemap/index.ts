import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (_req) => {
  const staticPages = [
    { url: "https://cosmicframe.app/", priority: "1.0", changefreq: "daily" },
    { url: "https://cosmicframe.app/sky-atlas", priority: "0.9", changefreq: "weekly" },
    { url: "https://cosmicframe.app/equipment", priority: "0.8", changefreq: "weekly" },
    { url: "https://cosmicframe.app/fov-calculator", priority: "0.8", changefreq: "monthly" },
    { url: "https://cosmicframe.app/light-pollution", priority: "0.7", changefreq: "monthly" },
  ];

  const { data: objects } = await supabase
    .from("celestial_objects")
    .select("catalog_id, updated_at")
    .order("photo_score", { ascending: false })
    .limit(200);

  const objectUrls = (objects ?? []).map(o => ({
    url: `https://cosmicframe.app/object/${encodeURIComponent(o.catalog_id)}`,
    priority: "0.6",
    changefreq: "monthly",
    lastmod: o.updated_at ? o.updated_at.split("T")[0] : null,
  }));

  const allUrls = [...staticPages, ...objectUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
