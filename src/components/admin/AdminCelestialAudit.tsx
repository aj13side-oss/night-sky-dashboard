import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw, ChevronLeft, ChevronRight, Search, Zap, Loader2, Command as CommandIcon, ArrowUpDown, CheckSquare, Rows3, ImageIcon, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { thumbUrl } from "@/lib/utils";
import { useAuditStatuses, useSetAuditStatus, checkImageHealth, type AuditStatus, type ImageHealth } from "@/hooks/useImageAudit";
import AuditCommandPalette, { type AuditableItem } from "./AuditCommandPalette";
import AuditBatchBar from "./AuditBatchBar";

interface WikiImage {
  url: string;
  artist: string | null;
  license: string | null;
  licenseUrl: string | null;
  filePageUrl: string | null;
  pageUrl: string | null;
  status: "loading" | "found" | "not_found" | "error";
}

const PAGE_SIZE = 100;

const CATALOG_PREFIXES = [
  { value: "all", label: "Tous" },
  { value: "M", label: "Messier (M)" },
  { value: "NGC", label: "NGC" },
  { value: "IC", label: "IC" },
  { value: "Sh2", label: "Sharpless (Sh2)" },
  { value: "Abell", label: "Abell" },
  { value: "UGC", label: "UGC" },
  { value: "PGC", label: "PGC" },
  { value: "Barnard", label: "Barnard" },
  { value: "Ced", label: "Cederblad" },
  { value: "vdB", label: "van den Bergh" },
  { value: "other", label: "Autres" },
];

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
  const [sortBy, setSortBy] = useState<"catalog_id" | "common_name" | "magnitude" | "status">("catalog_id");
  const [filterStatus, setFilterStatus] = useState("all");
  const [catalogPrefix, setCatalogPrefix] = useState("all");
  const needsClientFilter = filterStatus !== "all" || catalogPrefix === "other";
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [healthMap, setHealthMap] = useState<Record<string, ImageHealth>>({});
  const [brokenSet, setBrokenSet] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [wikiImages, setWikiImages] = useState<Record<string, WikiImage>>({});
  const [wikiFetching, setWikiFetching] = useState(false);
  const wikiFetchRef = useRef(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

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
    queryKey: ["admin_celestial", needsClientFilter ? "all" : page, objType, constellation, search, sortBy, catalogPrefix],
    queryFn: async () => {
      const knownPrefixes = CATALOG_PREFIXES.filter(p => p.value !== "all" && p.value !== "other").map(p => p.value);

      const buildQuery = () => {
        let q = (supabase as any)
          .from("celestial_objects")
          .select("id, catalog_id, common_name, obj_type, constellation, forced_image_url, magnitude, image_search_query, ra, dec, size_max", { count: "exact" });

        if (sortBy === "common_name") q = q.order("common_name", { ascending: true, nullsFirst: false });
        else if (sortBy === "magnitude") q = q.order("magnitude", { ascending: true, nullsFirst: false });
        else q = q.order("catalog_id");

        if (objType) q = q.eq("obj_type", objType);
        if (constellation) q = q.eq("constellation", constellation);
        if (search.trim()) {
          q = q.or(`catalog_id.ilike.%${search.trim()}%,common_name.ilike.%${search.trim()}%`);
        }
        // Server-side catalog prefix filter
        if (catalogPrefix !== "all" && catalogPrefix !== "other") {
          q = q.ilike("catalog_id", `${catalogPrefix}%`);
        }
        return q;
      };

      const filterOther = (items: any[]) => {
        if (catalogPrefix !== "other") return items;
        return items.filter((i: any) => !knownPrefixes.some(p => i.catalog_id?.startsWith(p)));
      };

      if (!needsClientFilter && catalogPrefix !== "other") {
        const q = buildQuery().range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        const { data, count, error } = await q;
        if (error) throw error;
        return { items: data ?? [], total: count ?? 0 };
      }

      // Fetch ALL rows in batches of 1000 for client-side filtering
      const allItems: any[] = [];
      let from = 0;
      const BATCH = 1000;
      let total = 0;
      while (true) {
        const q = buildQuery().range(from, from + BATCH - 1);
        const { data: batch, count, error } = await q;
        if (error) throw error;
        if (count != null) total = count;
        if (!batch || batch.length === 0) break;
        allItems.push(...batch);
        if (batch.length < BATCH) break;
        from += BATCH;
      }
      const filtered = filterOther(allItems);
      return { items: filtered, total: catalogPrefix === "other" ? filtered.length : total };
    },
    staleTime: 1000 * 60 * 5,
  });

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
      for (const r of batchResults) results[r.id] = r.health;
    }

    setHealthMap(prev => ({ ...prev, ...results }));
    const broken = Object.values(results).filter(r => r.status === "broken").length;
    const heavy = Object.values(results).filter(r => r.status === "heavy").length;
    toast.success(`Scan terminé : ${broken} cassées, ${heavy} lourdes, ${withImages.length - broken - heavy} OK`);
    setScanning(false);
  }, [data]);

  // Track broken images via onError
  const markBroken = useCallback((id: string) => {
    setBrokenSet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Apply client-side filtering
  const filteredAll = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;
    if (filterStatus !== "all") {
      list = list.filter((item: any) => {
        const s = audit[item.id];
        if (filterStatus === "no_image") return !item.forced_image_url;
        if (filterStatus === "flagged") return s === "flagged";
        if (filterStatus === "ok") return s === "ok";
        if (filterStatus === "unchecked") return !s || s === "unchecked";
        if (filterStatus === "heavy") return healthMap[item.id]?.status === "heavy";
        if (filterStatus === "broken") return brokenSet.has(item.id) || healthMap[item.id]?.status === "broken";
        return true;
      });
    }
    // Client-side sort by status
    if (sortBy === "status") {
      const statusOrder = (id: string) => {
        const s = audit[id];
        if (!s || s === "unchecked") return 0;
        if (s === "flagged") return 1;
        if (s === "ok") return 2;
        return 0;
      };
      list = [...list].sort((a: any, b: any) => statusOrder(a.id) - statusOrder(b.id));
    }
    return list;
  }, [data, filterStatus, audit, healthMap, sortBy, brokenSet]);

  // When client-side filtering, paginate the filtered results; otherwise use server results directly
  const totalPages = needsClientFilter
    ? Math.ceil(filteredAll.length / PAGE_SIZE)
    : Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const displayed = useMemo(() => {
    if (needsClientFilter) {
      return filteredAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    }
    return filteredAll;
  }, [filteredAll, needsClientFilter, page]);

  // Stagger image loading to prevent browser connection saturation
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    setVisibleCount(0);
    if (displayed.length === 0) return;
    // Reveal in batches of 20 every 100ms
    const timer = setInterval(() => {
      setVisibleCount(prev => {
        const next = prev + 20;
        if (next >= displayed.length) { clearInterval(timer); return displayed.length; }
        return next;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [displayed]);

  const getGridCols = useCallback(() => {
    if (!gridRef.current || !gridRef.current.firstElementChild) return 10;
    const gridWidth = gridRef.current.offsetWidth;
    const cardWidth = (gridRef.current.firstElementChild as HTMLElement).offsetWidth;
    return Math.max(1, Math.round(gridWidth / cardWidth));
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(displayed.map((i: any) => i.id)));
  }, [displayed]);

  const selectRow = useCallback((startIdx: number) => {
    const cols = getGridCols();
    const rowStart = Math.floor(startIdx / cols) * cols;
    const rowEnd = Math.min(rowStart + cols, displayed.length);
    setSelected(prev => {
      const next = new Set(prev);
      for (let i = rowStart; i < rowEnd; i++) next.add(displayed[i].id);
      return next;
    });
  }, [displayed, getGridCols]);

  const selectBroken = useCallback(() => {
    const broken = displayed.filter((i: any) => brokenSet.has(i.id) || healthMap[i.id]?.status === "broken");
    setSelected(new Set(broken.map((i: any) => i.id)));
    toast.success(`${broken.length} images cassées sélectionnées`);
  }, [displayed, brokenSet, healthMap]);

  const healthBadge = (id: string) => {
    const h = healthMap[id];
    const isBroken = brokenSet.has(id);
    if (isBroken && !h) return <Badge variant="destructive" className="text-[7px] px-1 py-0">Cassée</Badge>;
    if (!h) return null;
    if (h.status === "broken") return <Badge variant="destructive" className="text-[7px] px-1 py-0">Cassée</Badge>;
    if (h.status === "heavy") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">{h.sizeKB}KB</Badge>;
    return null;
  };

  // Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (displayed.length === 0) return;
      const cols = gridRef.current ? Math.round(gridRef.current.offsetWidth / ((gridRef.current.firstElementChild as HTMLElement)?.offsetWidth || 1)) : 8;

      if (e.key === "ArrowRight") { e.preventDefault(); setFocusIndex(i => Math.min(i + 1, displayed.length - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setFocusIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex(i => Math.min(i + cols, displayed.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIndex(i => Math.max(i - cols, 0)); }
      else if (focusIndex >= 0 && focusIndex < displayed.length) {
        const item = displayed[focusIndex];
        if (e.key === "1") { e.preventDefault(); setStatus(item.id, "ok"); }
        else if (e.key === "2") { e.preventDefault(); setStatus(item.id, "flagged"); }
        else if (e.key === "3") { e.preventDefault(); setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }
        else if (e.key === "4") { e.preventDefault(); window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.catalog_id} ${item.common_name || ''} astronomy astrophotography`)}`, "_blank"); }
        else if (e.key === " " || e.key === "Space") { e.preventDefault(); toggleSelect(item.id); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [displayed, focusIndex, replacing, toggleSelect]);

  useEffect(() => {
    if (focusIndex >= 0 && gridRef.current) {
      const card = gridRef.current.children[focusIndex] as HTMLElement;
      card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusIndex]);

  const cmdItems: AuditableItem[] = useMemo(() =>
    (data?.items ?? []).map((i: any) => ({
      id: i.id,
      label: `${i.catalog_id} ${i.common_name || ""}`.trim(),
      sublabel: `${i.obj_type || ""} · ${i.constellation || ""}`,
      hasImage: !!i.forced_image_url,
      status: audit[i.id],
    }))
  , [data, audit]);

  const handleCmdAction = useCallback((id: string, action: "ok" | "flag" | "replace" | "google" | "focus") => {
    const item = (data?.items ?? []).find((i: any) => i.id === id);
    if (!item) return;
    if (action === "ok") setAuditMutation.mutate({ targetId: id, status: "ok" });
    else if (action === "flag") setAuditMutation.mutate({ targetId: id, status: "flagged" });
    else if (action === "google") window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.catalog_id} ${item.common_name || ''} astronomy astrophotography`)}`, "_blank");
    else if (action === "focus" || action === "replace") {
      const idx = displayed.findIndex((i: any) => i.id === id);
      if (idx >= 0) setFocusIndex(idx);
      if (action === "replace") { setReplacing(id); setNewUrl(""); }
    }
  }, [data, displayed, setAuditMutation]);

  // Batch actions
  const batchOk = () => { selected.forEach(id => setAuditMutation.mutate({ targetId: id, status: "ok" })); setSelected(new Set()); toast.success(`${selected.size} marqués OK`); };
  const batchFlag = () => { selected.forEach(id => setAuditMutation.mutate({ targetId: id, status: "flagged" })); setSelected(new Set()); toast.success(`${selected.size} signalés`); };
  const batchGoogle = () => {
    let count = 0;
    selected.forEach(id => {
      const item = (data?.items ?? []).find((i: any) => i.id === id);
      if (item && count < 5) { window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.catalog_id} ${item.common_name || ''} astronomy astrophotography`)}`, "_blank"); count++; }
    });
    if (selected.size > 5) toast.info(`5 onglets ouverts sur ${selected.size} (limite navigateur)`);
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
        <Select value={sortBy} onValueChange={(v: any) => { setSortBy(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-secondary/30 border-border/50">
            <ArrowUpDown className="w-3 h-3 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="catalog_id">Tri : Catalogue (A→Z)</SelectItem>
            <SelectItem value="common_name">Tri : Nom commun (A→Z)</SelectItem>
            <SelectItem value="magnitude">Tri : Magnitude</SelectItem>
            <SelectItem value="status">Tri : Statut vérification</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setCmdOpen(true)} className="gap-1.5 text-xs">
          <CommandIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Recherche rapide</span>
          <kbd className="ml-1 px-1 py-0.5 rounded bg-muted border border-border text-[9px]">⌘K</kbd>
        </Button>
        <Button size="sm" variant="outline" onClick={scanImages} disabled={scanning} className="gap-1 text-xs">
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {scanning ? "Scan en cours..." : "Scanner les images"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {needsClientFilter ? `${filteredAll.length} filtrés / ${data?.total ?? 0}` : `${data?.total ?? 0} objets`} · Page {page + 1}/{totalPages || 1}
          {brokenSet.size > 0 && <span className="text-destructive ml-1">· {brokenSet.size} cassées détectées</span>}
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        {filterOptions && <ChipFilter label="Type" options={filterOptions.types} selected={objType} onChange={v => { setObjType(v); setPage(0); }} />}
        {filterOptions && <ChipFilter label="Constellation" options={filterOptions.constellations.slice(0, 30)} selected={constellation} onChange={v => { setConstellation(v); setPage(0); }} />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATALOG_PREFIXES.map(f => (
          <button key={f.value} onClick={() => { setCatalogPrefix(f.value); setPage(0); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${catalogPrefix === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={selectAll}>
          <CheckSquare className="w-3 h-3" /> Tout sélectionner ({displayed.length})
        </Button>
        {focusIndex >= 0 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => selectRow(focusIndex)}>
            <Rows3 className="w-3 h-3" /> Sélectionner la ligne
          </Button>
        )}
        {brokenSet.size > 0 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-destructive/50 text-destructive" onClick={selectBroken}>
            <X className="w-3 h-3" /> Sélectionner cassées ({brokenSet.size})
          </Button>
        )}
        <AuditBatchBar
          count={selected.size}
          onOk={batchOk}
          onFlag={batchFlag}
          onGoogle={batchGoogle}
          onClear={() => setSelected(new Set())}
        />
      </div>

      {focusIndex >= 0 && (
        <div className="text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1 flex gap-3 flex-wrap">
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">←→↑↓</kbd> naviguer</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">1</kbd> OK</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">2</kbd> Flag</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">3</kbd> Remplacer</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">4</kbd> Google</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px]">Espace</kbd> sélectionner</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div ref={gridRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {displayed.map((item: any, idx: number) => {
            const shouldLoadImage = idx < visibleCount;
            const status = audit[item.id] as AuditStatus | undefined;
            const isFocused = idx === focusIndex;
            const isSelected = selected.has(item.id);
            const borderClass = isFocused
              ? "ring-2 ring-primary border-primary"
              : isSelected
                ? "ring-1 ring-primary/50 border-primary/50"
                : status === "ok" ? "border-green-500/50" : status === "flagged" ? "border-red-500/50" : "border-border/50";
            return (
              <Card key={item.id} className={`${borderClass} overflow-hidden cursor-pointer transition-all`} onClick={() => setFocusIndex(idx)}>
                <CardContent className="p-1.5 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/50 text-transparent hover:border-primary/50"}`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                  {item.forced_image_url ? (
                    <div className={`aspect-square rounded bg-secondary/20 flex items-center justify-center overflow-hidden relative ${brokenSet.has(item.id) ? "ring-1 ring-destructive" : ""}`}>
                      {shouldLoadImage ? (
                        <img
                          src={thumbUrl(item.forced_image_url, 100)}
                          alt={item.catalog_id}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                          onError={() => markBroken(item.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/30 animate-pulse" />
                      )}
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
                      onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.catalog_id} ${item.common_name || ''} astronomy astrophotography`)}`, "_blank")}
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

      <AuditCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} items={cmdItems} onAction={handleCmdAction} />
    </div>
  );
}
