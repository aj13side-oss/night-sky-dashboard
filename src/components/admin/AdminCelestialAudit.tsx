import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { thumb400 } from "@/lib/utils";

type AuditStatus = "ok" | "flagged" | "unchecked";
type AuditData = Record<string, AuditStatus>;
const AUDIT_KEY = "astrodash_celestial_audit";

function loadAudit(): AuditData {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "{}"); } catch { return {}; }
}
function saveAudit(d: AuditData) { localStorage.setItem(AUDIT_KEY, JSON.stringify(d)); }

const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "no_image", label: "Sans image" },
  { value: "flagged", label: "Flaggés" },
  { value: "ok", label: "Confirmés OK" },
  { value: "unchecked", label: "Non vérifiés" },
];

export default function AdminCelestialAudit() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [objType, setObjType] = useState<string | null>(null);
  const [constellation, setConstellation] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [audit, setAudit] = useState<AuditData>(loadAudit);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");

  // Fetch obj_types and constellations for filters
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
    const next = { ...audit, [id]: s };
    setAudit(next);
    saveAudit(next);
  };

  const handleReplace = async (id: string) => {
    if (!newUrl.trim()) return;
    const { error } = await (supabase as any).from("celestial_objects").update({ forced_image_url: newUrl.trim() }).eq("id", id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Image mise à jour !");
    setReplacing(null);
    setNewUrl("");
    qc.invalidateQueries({ queryKey: ["admin_celestial"] });
  };

  // Client-side status filtering
  const displayed = useMemo(() => {
    if (!data?.items) return [];
    if (filterStatus === "all") return data.items;
    return data.items.filter((item: any) => {
      const s = audit[item.id];
      if (filterStatus === "no_image") return !item.forced_image_url;
      if (filterStatus === "flagged") return s === "flagged";
      if (filterStatus === "ok") return s === "ok";
      if (filterStatus === "unchecked") return !s;
      return true;
    });
  }, [data, filterStatus, audit]);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher catalog_id ou nom..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-secondary/30 border-border/50" />
        </div>
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
                    <div className="aspect-square rounded bg-secondary/20 flex items-center justify-center overflow-hidden">
                      <img src={thumb400(item.forced_image_url)} alt={item.catalog_id} loading="lazy" className="max-h-full max-w-full object-contain" />
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
                    <button onClick={() => { setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }} className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${replacing === item.id ? "bg-primary/20 border-primary text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}>
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
      )}

      {/* Pagination */}
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
