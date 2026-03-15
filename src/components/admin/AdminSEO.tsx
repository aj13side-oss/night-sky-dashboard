import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGES = [
  { path: "/", title: "Cosmic Frame — Astro Weather & Planning Dashboard", desc: "Real-time astronomical weather, ephemerides, and observation planning for astrophotographers.", jsonLd: "WebApplication + FAQ", hasCanonical: true },
  { path: "/sky-atlas", title: "4,800+ Deep Sky Objects — Sky Atlas", desc: "Browse and search the complete catalog of deep-sky objects with imaging guides.", jsonLd: "Dataset", hasCanonical: true },
  { path: "/rig-builder", title: "Astrophotography Gear Configurator", desc: "Build and compare astrophotography equipment configurations with compatibility checks.", jsonLd: "WebApplication", hasCanonical: true },
  { path: "/fov-calculator", title: "Field of View & Sampling Calculator", desc: "Calculate field of view, sampling resolution, and sensor coverage for your imaging setup.", jsonLd: "—", hasCanonical: true },
  { path: "/light-pollution", title: "Light Pollution Map & Dark Sites Finder", desc: "Interactive light pollution map with Bortle scale, dark site recommendations, and imaging impact analysis.", jsonLd: "—", hasCanonical: true },
  { path: "/planner", title: "Astrophotography Session Planner", desc: "Plan your imaging sessions with weather forecasts, object visibility, and optimal timing.", jsonLd: "—", hasCanonical: true },
];

const CHECKLIST = [
  { label: "robots.txt exists", done: true },
  { label: "sitemap.xml exists (6 pages)", done: true },
  { label: "manifest.json (PWA)", done: true },
  { label: "JSON-LD structured data", done: true },
  { label: "Domain: cosmicframe.app", done: false, pending: true },
  { label: "Google Search Console: not submitted", done: false, pending: true },
  { label: "OG Image: /og-image.png", done: false, pending: true },
];

export default function AdminSEO() {
  const { data: celestialSeoStats } = useQuery({
    queryKey: ["admin_seo_celestial"],
    queryFn: async () => {
      const { count: total } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true });
      const { count: withName } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("common_name", "is", null);
      const { count: withImage } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("forced_image_url", "is", null);
      return { total: total ?? 0, withName: withName ?? 0, withImage: withImage ?? 0 };
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="space-y-6 mt-4">
      {/* Pages Status */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pages Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Page</TableHead>
                <TableHead className="text-[10px]">Title</TableHead>
                <TableHead className="text-[10px] text-center">Description</TableHead>
                <TableHead className="text-[10px] text-center">JSON-LD</TableHead>
                <TableHead className="text-[10px] text-center">Canonical</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES.map(p => (
                <TableRow key={p.path}>
                  <TableCell className="text-[10px] font-mono">{p.path}</TableCell>
                  <TableCell className="text-[10px] max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[8px]">{p.desc.length} chars</Badge>
                  </TableCell>
                  <TableCell className="text-center text-[10px]">
                    {p.jsonLd !== "—" ? (
                      <Badge className="text-[8px] bg-green-500/20 text-green-400 border-green-500/50">{p.jsonLd}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.hasCanonical ? <Check className="w-3 h-3 text-green-400 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Technical Checklist */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Technical Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.done ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
              <span className={`text-xs ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Object Pages SEO */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Object Pages SEO</CardTitle>
        </CardHeader>
        <CardContent>
          {celestialSeoStats ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/20 rounded p-3 text-center">
                  <p className="text-xl font-bold font-mono text-foreground">{celestialSeoStats.total.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total object pages</p>
                </div>
                <div className="bg-muted/20 rounded p-3 text-center">
                  <p className="text-xl font-bold font-mono text-foreground">{celestialSeoStats.withName}</p>
                  <p className="text-[10px] text-muted-foreground">With common_name (better SEO)</p>
                </div>
                <div className="bg-muted/20 rounded p-3 text-center">
                  <p className="text-xl font-bold font-mono text-foreground">{celestialSeoStats.withImage}</p>
                  <p className="text-[10px] text-muted-foreground">With forced_image_url (OG image)</p>
                </div>
              </div>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" /> Submit sitemap to Google Search Console
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
