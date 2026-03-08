import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw, ChevronLeft, ChevronRight, Search, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { thumb400 } from "@/lib/utils";
import { useAuditStatuses, useSetAuditStatus, checkImageHealth, type AuditStatus, type ImageHealth } from "@/hooks/useImageAudit";

const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "no_image", label: "Sans image" },
  { value: "flagged", label: "Signalés" },
  { value: "ok", label: "Vérifiés ✓" },
  { value: "unchecked", label: "Non vérifiés" },
  { value: "heavy", label: "⚠ Lourdes (>2MB)" },
  { value: "broken", label: "❌ Cassées" },
];

export default function AdminCelestialAudit() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [objType, setObjType] = useState<string | null>(null);
  const [constellation, setConstellation] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [healthMap, setHealthMap] = useState<Record<string, ImageHealth>>({});
  const [scanning, setScanning] = useState(false);

  const { data: audit = {} } = useAuditStatuses("celestial_objects");
  const setAuditMutation = useSetAuditStatus("celestial_objects");

  const { data: filterOptions } = useQuery({
    queryKey: ["admin_celestial_filters"],
    queryFn: async () => {
      const { data: types } = await (supabase as any).from("celestial_objects").select("obj_type").not("obj_type", "is", null);
      const { data: consts } = await (supabase as any).from("celestial_objects").select("constellation").not("constellation", "is", null);
      const uniqueTypes = [...new Set((types ?? []).map((r: any) => r.obj_type))].sort() as string[];
      const uniqueConsts = [...new Set((consts ?? []).map((r: any) => r.constellation))].sort() as string[];
      return { types: uniqueTypes, constellations: uniqueConsts };
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin_celestial", page, objType, constellation, search],
    queryFn: async () => {
      let q = (supabase as any)
        .from("celestial_objects")
        .select("id, catalog_id, common_name, obj_type, constellation, forced_image_url, magnitude", { count: "exact" })
        .order("catalog_id");
      if (objType) q = q.eq("obj_type", objType);
      if (constellation) q = q.eq("constellation", constellation);
      if (search.trim()) {
        q = q.or(`catalog_id.ilike.%${search.trim()}%,common_name.ilike.%${search.trim()}%`);
      }
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const setStatus = (id: string, s: AuditStatus) => {
    setAuditMutation.mutate({ targetId: id, status: s });
  };

  const handleReplace = async (id: string) => {
    if (!newUrl.trim()) return;
    const { error } = await (supabase as any).from("celestial_objects").update({ forced_image_url: newUrl.trim() }).eq("id", id);
    if (error) { toast.error("Erreur : " + error.message); return; }
    toast.success("Image mise à jour !");
    setReplacing(null);
    setNewUrl("");
    qc.invalidateQueries({ queryKey: ["admin_celestial"] });
  };

  const scanImages = useCallback(async () => {
    if (!data?.items) return;
    setScanning(true);
    const withImages = data.items.filter((i: any) => i.forced_image_url);
    const results: Record<string, ImageHealth> = {};

    for (let i = 0; i < withImages.length; i += 5) {
      const batch = withImages.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (item: any) => {
          const health = await checkImageHealth(item.forced_image_url);
          return { id: item.id, health };
        })
      );
      for (const r of batchResults) {
        results[r.id] = r.health;
      }
    }

    setHealthMap(prev => ({ ...prev, ...results }));
    const broken = Object.values(results).filter(r => r.status === "broken").length;
    const heavy = Object.values(results).filter(r => r.status === "heavy").length;
    toast.success(`Scan terminé : ${broken} cassées, ${heavy} lourdes, ${withImages.length - broken - heavy} OK`);
    setScanning(false);
  }, [data]);

  const displayed = useMemo(() => {
    if (!data?.items) return [];
    if (filterStatus === "all") return data.items;
    return data.items.filter((item: any) => {
      const s = audit[item.id];
      if (filterStatus === "no_image") return !item.forced_image_url;
      if (filterStatus === "flagged") return s === "flagged";
      if (filterStatus === "ok") return s === "ok";
      if (filterStatus === "unchecked") return !s || s === "unchecked";
      if (filterStatus === "heavy") return healthMap[item.id]?.status === "heavy";
      if (filterStatus === "broken") return healthMap[item.id]?.status === "broken";
      return true;
    });
  }, [data, filterStatus, audit, healthMap]);

  const healthBadge = (id: string) => {
    const h = healthMap[id];
    if (!h) return null;
    if (h.status === "broken") return <Badge variant="destructive" className="text-[7px] px-1 py-0">Cassée</Badge>;
    if (h.status === "heavy") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">{h.sizeKB}KB</Badge>;
    return null;
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher catalog_id ou nom..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-secondary/30 border-border/50" />
        </div>
        <Button size="sm" variant="outline" onClick={scanImages} disabled={scanning} className="gap-1 text-xs">
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {scanning ? "Scan en cours..." : "Scanner les images"}
        </Button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} objets · Page {page + 1}/{totalPages || 1}</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {filterOptions && <ChipFilter label="Type" options={filterOptions.types} selected={objType} onChange={v => { setObjType(v); setPage(0); }} />}
        {filterOptions && <ChipFilter label="Constellation" options={filterOptions.constellations.slice(0, 30)} selected={constellation} onChange={v => { setConstellation(v); setPage(0); }} />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {displayed.map((item: any) => {
            const status = audit[item.id] as AuditStatus | undefined;
            const borderClass = status === "ok" ? "border-green-500/50" : status === "flagged" ? "border-red-500/50" : "border-border/50";
            return (
              <Card key={item.id} className={`${borderClass} overflow-hidden`}>
                <CardContent className="p-1.5 space-y-1">
                  {item.forced_image_url ? (
                    <div className="aspect-square rounded bg-secondary/20 flex items-center justify-center overflow-hidden relative">
                      <img src={thumb400(item.forced_image_url)} alt={item.catalog_id} loading="lazy" className="max-h-full max-w-full object-contain" />
                      <div className="absolute top-0.5 right-0.5">{healthBadge(item.id)}</div>
                    </div>
                  ) : (
                    <div className="aspect-square rounded bg-orange-500/10 flex items-center justify-center">
                      <span className="text-[8px] font-medium text-orange-400">PAS D'IMAGE</span>
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-foreground truncate">{item.catalog_id}</p>
                  {item.common_name && <p className="text-[8px] text-muted-foreground truncate">{item.common_name}</p>}
                  <div className="flex gap-0.5">
                    <button onClick={() => setStatus(item.id, "ok")} className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "ok" ? "bg-green-500/20 border-green-500 text-green-400" : "border-border/50 text-muted-foreground hover:border-green-500/50"}`}>
                      <Check className="w-2.5 h-2.5 mx-auto" />
                    </button>
                    <button onClick={() => setStatus(item.id, "flagged")} className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "flagged" ? "bg-red-500/20 border-red-500 text-red-400" : "border-border/50 text-muted-foreground hover:border-red-500/50"}`}>
                      <X className="w-2.5 h-2.5 mx-auto" />
                    </button>
                    <button onClick={() => { setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }} className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${
                      replacing === item.id
                        ? "bg-primary/20 border-primary text-primary"
                        : !item.forced_image_url
                          ? "border-orange-500/50 text-orange-400 hover:border-primary/50"
                          : "border-border/50 text-muted-foreground hover:border-primary/50"
                    }`}>
                      <RefreshCw className="w-2.5 h-2.5 mx-auto" />
                    </button>
                    <button
                      onClick={() => {
                        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.catalog_id} ${item.common_name || ''} astronomy astrophotography`)}`, "_blank");
                      }}
                      title="Google Images"
                      className="flex-1 py-0.5 rounded text-[8px] border border-border/50 text-muted-foreground hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                    >
                      <Search className="w-2.5 h-2.5 mx-auto" />
                    </button>
                  </div>
                  {replacing === item.id && (
                    <div className="space-y-0.5">
                      <div className="flex gap-0.5">
                        <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Coller l'URL de l'image..." className="h-5 text-[9px] px-1" />
                        <Button size="sm" className="h-5 px-1.5 text-[9px]" variant="outline"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setNewUrl(text);
                            } catch { toast.error("Accès presse-papiers refusé"); }
                          }}>📋</Button>
                        <Button size="sm" className="h-5 px-1.5 text-[9px]" onClick={() => handleReplace(item.id)}>OK</Button>
                      </div>
                      {newUrl && newUrl.match(/^https?:\/\//) && (
                        <div className="aspect-video rounded bg-secondary/20 flex items-center justify-center overflow-hidden">
                          <img src={newUrl} alt="preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage(p => p - 1)} className="gap-1">
          <ChevronLeft className="w-3 h-3" /> Précédent
        </Button>
        <span className="text-xs text-muted-foreground">Page {page + 1} / {totalPages || 1}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="gap-1">
          Suivant <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
