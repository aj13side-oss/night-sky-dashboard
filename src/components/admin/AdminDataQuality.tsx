import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories } from "@/hooks/useEquipmentCatalog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RETAILERS = ["amazon", "pierro_astro", "optique_unterlinden", "agena", "high_point_scientific", "astronome_fr", "astroshop_de", "univers_astro"];

function CoverageCell({ count, total }: { count: number; total: number }) {
  if (total === 0) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round((count / total) * 100);
  const color = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
  const bg = pct >= 80 ? "bg-green-500/10" : pct >= 50 ? "bg-amber-500/10" : "bg-red-500/10";
  return (
    <span className={`${color} ${bg} px-2 py-0.5 rounded font-mono text-[10px]`}>
      {count}/{total} ({pct}%)
    </span>
  );
}

export default function AdminDataQuality() {
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const { data: accessories } = useAccessories();

  const { data: celestialStats } = useQuery({
    queryKey: ["admin_celestial_quality"],
    queryFn: async () => {
      const { count: total } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true });
      const { count: withImage } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("forced_image_url", "is", null);
      const { count: withName } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("common_name", "is", null);
      const { count: withExposure } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("exposure_guide_fast", "is", null);
      const { count: withScore } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).gt("photo_score", 0);
      const { count: missingCoords } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).or("ra.is.null,dec.is.null");
      return { total: total ?? 0, withImage: withImage ?? 0, withName: withName ?? 0, withExposure: withExposure ?? 0, withScore: withScore ?? 0, missingCoords: missingCoords ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  const coverage = useMemo(() => {
    const cats = [
      { label: "Cameras", items: cameras ?? [], requiredSpecs: ["pixel_size_um", "sensor_width_mm", "sensor_height_mm"] },
      { label: "Telescopes", items: telescopes ?? [], requiredSpecs: ["focal_length_mm", "aperture_mm"] },
      { label: "Mounts", items: mounts ?? [], requiredSpecs: ["payload_kg"] },
      { label: "Filters", items: filters ?? [], requiredSpecs: ["type"] },
      { label: "Accessories", items: accessories ?? [], requiredSpecs: ["category"] },
    ];
    return cats.map(c => {
      const total = c.items.length;
      const withImage = c.items.filter((i: any) => i.image_url).length;
      const specsComplete = c.items.filter((i: any) => c.requiredSpecs.every(s => i[s] != null && i[s] !== "" && i._raw?.[s] != null)).length;
      const withPrice = c.items.filter((i: any) => RETAILERS.some(r => (i._raw?.[`price_${r}`] ?? null) != null && i._raw[`price_${r}`] > 0)).length;
      const withUrl = c.items.filter((i: any) => RETAILERS.some(r => !!i._raw?.[`url_${r}`])).length;
      const withMfr = c.items.filter((i: any) => !!i._raw?.url_manufacturer).length;
      return { ...c, total, withImage, specsComplete, withPrice, withUrl, withMfr };
    });
  }, [cameras, telescopes, mounts, filters, accessories]);

  const actionItems = useMemo(() => {
    const items: { label: string; severity: "high" | "medium" | "low" }[] = [];
    for (const c of coverage) {
      if (c.total === 0) continue;
      const imgPct = (c.withImage / c.total) * 100;
      const pricePct = (c.withPrice / c.total) * 100;
      if (imgPct < 80) items.push({ label: `${c.total - c.withImage} ${c.label.toLowerCase()} missing images`, severity: imgPct < 50 ? "high" : "medium" });
      if (pricePct < 50) items.push({ label: `${c.label}: ${Math.round(pricePct)}% price coverage`, severity: pricePct < 10 ? "high" : "medium" });
      const urlPct = (c.withUrl / c.total) * 100;
      if (urlPct < 50) items.push({ label: `${c.label}: ${Math.round(urlPct)}% retailer URL coverage`, severity: "medium" });
    }
    items.sort((a, b) => (a.severity === "high" ? 0 : a.severity === "medium" ? 1 : 2) - (b.severity === "high" ? 0 : b.severity === "medium" ? 1 : 2));
    return items;
  }, [coverage]);

  return (
    <div className="space-y-6 mt-4">
      {/* Coverage Matrix */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Coverage Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Category</TableHead>
                  <TableHead className="text-[10px] text-center">Image</TableHead>
                  <TableHead className="text-[10px] text-center">Specs Complete</TableHead>
                  <TableHead className="text-[10px] text-center">≥1 Price</TableHead>
                  <TableHead className="text-[10px] text-center">≥1 URL</TableHead>
                  <TableHead className="text-[10px] text-center">Manufacturer URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.map(c => (
                  <TableRow key={c.label}>
                    <TableCell className="text-xs font-medium">{c.label} ({c.total})</TableCell>
                    <TableCell className="text-center"><CoverageCell count={c.withImage} total={c.total} /></TableCell>
                    <TableCell className="text-center"><CoverageCell count={c.specsComplete} total={c.total} /></TableCell>
                    <TableCell className="text-center"><CoverageCell count={c.withPrice} total={c.total} /></TableCell>
                    <TableCell className="text-center"><CoverageCell count={c.withUrl} total={c.total} /></TableCell>
                    <TableCell className="text-center"><CoverageCell count={c.withMfr} total={c.total} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">All coverage looks good! 🎉</p>
          ) : (
            actionItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant={item.severity === "high" ? "destructive" : "secondary"} className="text-[8px]">
                    {item.severity}
                  </Badge>
                  <span className="text-xs text-foreground">{item.label}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Celestial Objects Quality */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Celestial Objects Quality</CardTitle>
        </CardHeader>
        <CardContent>
          {celestialStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Total objects", value: celestialStats.total },
                { label: "With real photo", value: celestialStats.withImage },
                { label: "With common name", value: celestialStats.withName },
                { label: "With exposure guide", value: celestialStats.withExposure },
                { label: "With photo_score > 0", value: celestialStats.withScore },
                { label: "Missing RA/Dec", value: celestialStats.missingCoords },
              ].map(s => (
                <div key={s.label} className="bg-muted/20 rounded p-3 text-center">
                  <p className="text-xl font-bold font-mono text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
