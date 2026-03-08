import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, RefreshCw, Download, Camera, Telescope, Anchor, Filter, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories } from "@/hooks/useEquipmentCatalog";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { useQueryClient } from "@tanstack/react-query";
import { thumb400 } from "@/lib/utils";
import { useAuditStatuses, useSetAuditStatus, checkImageHealth, type AuditStatus, type ImageHealth } from "@/hooks/useImageAudit";

type EquipItem = { id: string; brand: string; model: string; image_url: string | null };
type TableName = "astro_cameras" | "astro_telescopes" | "astro_mounts" | "astro_filters" | "astro_accessories";

function AuditGrid({ items, tableName, filterStatus, brandFilter }: {
  items: EquipItem[]; tableName: TableName; filterStatus: string; brandFilter: string | null;
}) {
  const qc = useQueryClient();
  const { data: audit = {} } = useAuditStatuses(tableName);
  const setAuditMutation = useSetAuditStatus(tableName);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [healthMap, setHealthMap] = useState<Record<string, ImageHealth>>({});
  const [scanning, setScanning] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (brandFilter) list = list.filter(i => i.brand === brandFilter);
    if (filterStatus === "no_image") list = list.filter(i => !i.image_url);
    else if (filterStatus === "flagged") list = list.filter(i => audit[i.id] === "flagged");
    else if (filterStatus === "ok") list = list.filter(i => audit[i.id] === "ok");
    else if (filterStatus === "unchecked") list = list.filter(i => !audit[i.id] || audit[i.id] === "unchecked");
    else if (filterStatus === "heavy") list = list.filter(i => healthMap[i.id]?.status === "heavy");
    else if (filterStatus === "broken") list = list.filter(i => healthMap[i.id]?.status === "broken");
    return list;
  }, [items, brandFilter, filterStatus, audit, healthMap]);

  const setStatus = (id: string, s: AuditStatus) => {
    setAuditMutation.mutate({ targetId: id, status: s });
  };

  const handleReplace = async (id: string) => {
    if (!newUrl.trim()) return;
    const { error } = await (supabase as any).from(tableName).update({ image_url: newUrl.trim() }).eq("id", id);
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success("Image updated!");
    setReplacing(null);
    setNewUrl("");
    qc.invalidateQueries({ queryKey: [tableName.replace("astro_", "astro_")] });
  };

  const scanImages = useCallback(async () => {
    setScanning(true);
    const withImages = items.filter(i => i.image_url);
    const results: Record<string, ImageHealth> = {};
    let done = 0;

    // Process in batches of 5
    for (let i = 0; i < withImages.length; i += 5) {
      const batch = withImages.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const health = await checkImageHealth(item.image_url!);
          return { id: item.id, health };
        })
      );
      for (const r of batchResults) {
        results[r.id] = r.health;
      }
      done += batch.length;
      if (done % 20 === 0) toast.info(`Scanned ${done}/${withImages.length} images...`);
    }

    setHealthMap(results);
    const broken = Object.values(results).filter(r => r.status === "broken").length;
    const heavy = Object.values(results).filter(r => r.status === "heavy").length;
    toast.success(`Scan complete: ${broken} broken, ${heavy} heavy (>2MB), ${withImages.length - broken - heavy} OK`);
    setScanning(false);
  }, [items]);

  const exportReport = () => {
    const lines: string[] = ["=== IMAGE AUDIT REPORT ===\n"];
    const flagged = items.filter(i => audit[i.id] === "flagged");
    const missing = items.filter(i => !i.image_url);
    const heavy = items.filter(i => healthMap[i.id]?.status === "heavy");
    const broken = items.filter(i => healthMap[i.id]?.status === "broken");
    lines.push(`Flagged (${flagged.length}):`);
    flagged.forEach(i => lines.push(`  - ${i.brand} ${i.model} (${i.id})`));
    lines.push(`\nNo image (${missing.length}):`);
    missing.forEach(i => lines.push(`  - ${i.brand} ${i.model} (${i.id})`));
    lines.push(`\nHeavy >2MB (${heavy.length}):`);
    heavy.forEach(i => lines.push(`  - ${i.brand} ${i.model} — ${healthMap[i.id]?.sizeKB}KB`));
    lines.push(`\nBroken (${broken.length}):`);
    broken.forEach(i => lines.push(`  - ${i.brand} ${i.model}`));
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit_${tableName}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const healthBadge = (id: string) => {
    const h = healthMap[id];
    if (!h) return null;
    if (h.status === "broken") return <Badge variant="destructive" className="text-[7px] px-1 py-0">Broken</Badge>;
    if (h.status === "heavy") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">{h.sizeKB}KB</Badge>;
    if (h.status === "slow") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">Slow</Badge>;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length > 1 ? "s" : ""}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={scanImages} disabled={scanning} className="gap-1 text-xs">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {scanning ? "Scanning..." : "Scan Image Health"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportReport} className="gap-1 text-xs">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {filtered.map(item => {
          const status = audit[item.id] as AuditStatus | undefined;
          const borderClass = status === "ok" ? "border-green-500/50" : status === "flagged" ? "border-red-500/50" : "border-border/50";
          return (
            <Card key={item.id} className={`${borderClass} overflow-hidden`}>
              <CardContent className="p-1.5 space-y-1">
                {item.image_url ? (
                  <div className="aspect-square rounded bg-secondary/20 flex items-center justify-center overflow-hidden relative">
                    <img src={thumb400(item.image_url)} alt={item.model} loading="lazy" className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-0.5 right-0.5">{healthBadge(item.id)}</div>
                  </div>
                ) : (
                  <div className="aspect-square rounded bg-orange-500/10 flex items-center justify-center">
                    <span className="text-[9px] font-medium text-orange-400">NO IMAGE</span>
                  </div>
                )}
                <p className="text-[9px] font-medium text-foreground truncate leading-tight">{item.brand} {item.model}</p>
                <div className="flex gap-0.5">
                  <button onClick={() => setStatus(item.id, "ok")} title="OK"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "ok" ? "bg-green-500/20 border-green-500 text-green-400" : "border-border/50 text-muted-foreground hover:border-green-500/50"}`}>
                    <Check className="w-2.5 h-2.5 mx-auto" />
                  </button>
                  <button onClick={() => setStatus(item.id, "flagged")} title="Flag"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "flagged" ? "bg-red-500/20 border-red-500 text-red-400" : "border-border/50 text-muted-foreground hover:border-red-500/50"}`}>
                    <X className="w-2.5 h-2.5 mx-auto" />
                  </button>
                  <button onClick={() => { setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }} title="Replace"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${replacing === item.id ? "bg-primary/20 border-primary text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}>
                    <RefreshCw className="w-2.5 h-2.5 mx-auto" />
                  </button>
                </div>
                {replacing === item.id && (
                  <div className="flex gap-0.5">
                    <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL..." className="h-5 text-[9px] px-1" />
                    <Button size="sm" className="h-5 px-1.5 text-[9px]" onClick={() => handleReplace(item.id)}>OK</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "no_image", label: "No image" },
  { value: "flagged", label: "Flagged" },
  { value: "ok", label: "Verified ✓" },
  { value: "unchecked", label: "Unchecked" },
  { value: "heavy", label: "⚠ Heavy (>2MB)" },
  { value: "broken", label: "❌ Broken" },
];

export default function AdminImageAudit() {
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const { data: accessories } = useAccessories();

  const [cat, setCat] = useState("cameras");
  const [filterStatus, setFilterStatus] = useState("all");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);

  const items: EquipItem[] = useMemo(() => {
    const src = cat === "cameras" ? cameras : cat === "telescopes" ? telescopes : cat === "mounts" ? mounts : cat === "accessories" ? accessories : filters;
    return (src ?? []).map(i => ({ id: i.id, brand: i.brand, model: i.model, image_url: i.image_url }));
  }, [cat, cameras, telescopes, mounts, filters, accessories]);

  const tableName: TableName = `astro_${cat}` as TableName;
  const brands = useMemo(() => [...new Set(items.map(i => i.brand))].sort(), [items]);

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={cat} onValueChange={setCat}>
        <TabsList>
          <TabsTrigger value="cameras" className="gap-1 text-xs"><Camera className="w-3 h-3" /> Cameras</TabsTrigger>
          <TabsTrigger value="telescopes" className="gap-1 text-xs"><Telescope className="w-3 h-3" /> Telescopes</TabsTrigger>
          <TabsTrigger value="mounts" className="gap-1 text-xs"><Anchor className="w-3 h-3" /> Mounts</TabsTrigger>
          <TabsTrigger value="filters" className="gap-1 text-xs"><Filter className="w-3 h-3" /> Filters</TabsTrigger>
          <TabsTrigger value="accessories" className="gap-1 text-xs"><Zap className="w-3 h-3" /> Accessories</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <ChipFilter label="Brand" options={brands} selected={brandFilter} onChange={setBrandFilter} />

      <AuditGrid items={items} tableName={tableName} filterStatus={filterStatus} brandFilter={brandFilter} />
    </div>
  );
}
