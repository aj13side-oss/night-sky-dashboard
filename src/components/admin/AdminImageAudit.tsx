import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, RefreshCw, Download, Camera, Telescope, Anchor, Filter, Zap, Search, Loader2, Command as CommandIcon, Checkbox } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories } from "@/hooks/useEquipmentCatalog";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { useQueryClient } from "@tanstack/react-query";
import { thumb400 } from "@/lib/utils";
import { useAuditStatuses, useSetAuditStatus, checkImageHealth, type AuditStatus, type ImageHealth } from "@/hooks/useImageAudit";
import AuditCommandPalette, { type AuditableItem } from "./AuditCommandPalette";
import AuditBatchBar from "./AuditBatchBar";

type EquipItem = { id: string; brand: string; model: string; image_url: string | null; url_manufacturer: string | null };
type TableName = "astro_cameras" | "astro_telescopes" | "astro_mounts" | "astro_filters" | "astro_accessories";

const CAT_WORD: Record<TableName, string> = {
  astro_cameras: "camera",
  astro_telescopes: "telescope",
  astro_mounts: "mount",
  astro_filters: "filter",
  astro_accessories: "accessory",
};

function AuditGrid({ items, tableName, filterStatus, brandFilter, searchQuery, selected, onToggleSelect, focusId }: {
  items: EquipItem[]; tableName: TableName; filterStatus: string; brandFilter: string | null;
  searchQuery: string; selected: Set<string>; onToggleSelect: (id: string) => void; focusId: string | null;
}) {
  const qc = useQueryClient();
  const { data: audit = {} } = useAuditStatuses(tableName);
  const setAuditMutation = useSetAuditStatus(tableName);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [healthMap, setHealthMap] = useState<Record<string, ImageHealth>>({});
  const [scanning, setScanning] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (brandFilter) list = list.filter(i => i.brand === brandFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => `${i.brand} ${i.model}`.toLowerCase().includes(q));
    }
    if (filterStatus === "no_image") list = list.filter(i => !i.image_url);
    else if (filterStatus === "flagged") list = list.filter(i => audit[i.id] === "flagged");
    else if (filterStatus === "ok") list = list.filter(i => audit[i.id] === "ok");
    else if (filterStatus === "unchecked") list = list.filter(i => !audit[i.id] || audit[i.id] === "unchecked");
    else if (filterStatus === "heavy") list = list.filter(i => healthMap[i.id]?.status === "heavy");
    else if (filterStatus === "broken") list = list.filter(i => healthMap[i.id]?.status === "broken");
    return list;
  }, [items, brandFilter, filterStatus, audit, healthMap, searchQuery]);

  // Focus on item from command palette
  useEffect(() => {
    if (focusId) {
      const idx = filtered.findIndex(i => i.id === focusId);
      if (idx >= 0) setFocusIndex(idx);
    }
  }, [focusId, filtered]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (filtered.length === 0) return;

      const cols = gridRef.current ? Math.round(gridRef.current.offsetWidth / (gridRef.current.firstElementChild as HTMLElement)?.offsetWidth || 1) : 6;

      if (e.key === "ArrowRight") { e.preventDefault(); setFocusIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setFocusIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex(i => Math.min(i + cols, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIndex(i => Math.max(i - cols, 0)); }
      else if (focusIndex >= 0 && focusIndex < filtered.length) {
        const item = filtered[focusIndex];
        if (e.key === "1") { e.preventDefault(); setStatus(item.id, "ok"); }
        else if (e.key === "2") { e.preventDefault(); setStatus(item.id, "flagged"); }
        else if (e.key === "3") { e.preventDefault(); setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }
        else if (e.key === "4") { e.preventDefault(); openGoogle(item); }
        else if (e.key === " " || e.key === "Space") { e.preventDefault(); onToggleSelect(item.id); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, focusIndex, replacing]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusIndex >= 0 && gridRef.current) {
      const card = gridRef.current.children[focusIndex] as HTMLElement;
      card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusIndex]);

  const setStatus = (id: string, s: AuditStatus) => {
    setAuditMutation.mutate({ targetId: id, status: s });
  };

  const openGoogle = (item: EquipItem) => {
    const catWord = CAT_WORD[tableName] ?? "product";
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.brand} ${item.model} ${catWord} product photo`)}`, "_blank");
  };

  const handleReplace = async (id: string) => {
    if (!newUrl.trim()) return;
    const { error } = await (supabase as any).from(tableName).update({ image_url: newUrl.trim() }).eq("id", id);
    if (error) { toast.error("Erreur : " + error.message); return; }
    toast.success("Image mise à jour !");
    setReplacing(null);
    setNewUrl("");
    qc.invalidateQueries({ queryKey: [tableName.replace("astro_", "astro_")] });
  };

  const scanImages = useCallback(async () => {
    setScanning(true);
    const withImages = items.filter(i => i.image_url);
    const results: Record<string, ImageHealth> = {};
    let done = 0;

    for (let i = 0; i < withImages.length; i += 5) {
      const batch = withImages.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const health = await checkImageHealth(item.image_url!);
          return { id: item.id, health };
        })
      );
      for (const r of batchResults) results[r.id] = r.health;
      done += batch.length;
      if (done % 20 === 0) toast.info(`${done}/${withImages.length} images scannées...`);
    }

    setHealthMap(results);
    const broken = Object.values(results).filter(r => r.status === "broken").length;
    const heavy = Object.values(results).filter(r => r.status === "heavy").length;
    toast.success(`Scan terminé : ${broken} cassées, ${heavy} lourdes (>2MB), ${withImages.length - broken - heavy} OK`);
    setScanning(false);
  }, [items]);

  const exportReport = () => {
    const lines: string[] = ["=== RAPPORT D'AUDIT IMAGES ===\n"];
    const flagged = items.filter(i => audit[i.id] === "flagged");
    const missing = items.filter(i => !i.image_url);
    const heavy = items.filter(i => healthMap[i.id]?.status === "heavy");
    const broken = items.filter(i => healthMap[i.id]?.status === "broken");
    lines.push(`Signalés (${flagged.length}):`);
    flagged.forEach(i => lines.push(`  - ${i.brand} ${i.model} (${i.id})`));
    lines.push(`\nSans image (${missing.length}):`);
    missing.forEach(i => lines.push(`  - ${i.brand} ${i.model} (${i.id})`));
    lines.push(`\nLourdes >2MB (${heavy.length}):`);
    heavy.forEach(i => lines.push(`  - ${i.brand} ${i.model} — ${healthMap[i.id]?.sizeKB}KB`));
    lines.push(`\nCassées (${broken.length}):`);
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
    if (h.status === "broken") return <Badge variant="destructive" className="text-[7px] px-1 py-0">Cassée</Badge>;
    if (h.status === "heavy") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">{h.sizeKB}KB</Badge>;
    if (h.status === "slow") return <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">Lent</Badge>;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={scanImages} disabled={scanning} className="gap-1 text-xs">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {scanning ? "Scan en cours..." : "Scanner les images"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportReport} className="gap-1 text-xs">
            <Download className="w-3 h-3" /> Exporter
          </Button>
        </div>
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

      <div ref={gridRef} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {filtered.map((item, idx) => {
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
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/50 text-transparent hover:border-primary/50"}`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </button>
                </div>
                {item.image_url ? (
                  <div className="aspect-square rounded bg-secondary/20 flex items-center justify-center overflow-hidden relative">
                    <img src={thumb400(item.image_url)} alt={item.model} loading="lazy" className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-0.5 right-0.5">{healthBadge(item.id)}</div>
                  </div>
                ) : (
                  <div className="aspect-square rounded bg-orange-500/10 flex items-center justify-center">
                    <span className="text-[8px] font-medium text-orange-400">PAS D'IMAGE</span>
                  </div>
                )}
                <p className="text-[9px] font-medium text-foreground truncate leading-tight">{item.brand} {item.model}</p>
                {item.url_manufacturer && (
                  <a href={item.url_manufacturer} target="_blank" rel="noopener noreferrer"
                    className="text-[7px] text-primary/60 hover:text-primary truncate block">
                    ↗ Site constructeur
                  </a>
                )}
                <div className="flex gap-0.5">
                  <button onClick={() => setStatus(item.id, "ok")} title="OK"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "ok" ? "bg-green-500/20 border-green-500 text-green-400" : "border-border/50 text-muted-foreground hover:border-green-500/50"}`}>
                    <Check className="w-2.5 h-2.5 mx-auto" />
                  </button>
                  <button onClick={() => setStatus(item.id, "flagged")} title="Signaler"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${status === "flagged" ? "bg-red-500/20 border-red-500 text-red-400" : "border-border/50 text-muted-foreground hover:border-red-500/50"}`}>
                    <X className="w-2.5 h-2.5 mx-auto" />
                  </button>
                  <button onClick={() => { setReplacing(replacing === item.id ? null : item.id); setNewUrl(""); }} title="Remplacer"
                    className={`flex-1 py-0.5 rounded text-[8px] border transition-colors ${
                      replacing === item.id
                        ? "bg-primary/20 border-primary text-primary"
                        : !item.image_url
                          ? "border-orange-500/50 text-orange-400 hover:border-primary/50"
                          : "border-border/50 text-muted-foreground hover:border-primary/50"
                    }`}>
                    <RefreshCw className="w-2.5 h-2.5 mx-auto" />
                  </button>
                  <button onClick={() => openGoogle(item)} title="Google Images"
                    className="flex-1 py-0.5 rounded text-[8px] border border-border/50 text-muted-foreground hover:border-blue-500/50 hover:text-blue-400 transition-colors">
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
    </div>
  );
}

const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "no_image", label: "Sans image" },
  { value: "flagged", label: "Signalés" },
  { value: "ok", label: "Vérifiés ✓" },
  { value: "unchecked", label: "Non vérifiés" },
  { value: "heavy", label: "⚠ Lourdes (>2MB)" },
  { value: "broken", label: "❌ Cassées" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);

  const items: EquipItem[] = useMemo(() => {
    const src = cat === "cameras" ? cameras : cat === "telescopes" ? telescopes : cat === "mounts" ? mounts : cat === "accessories" ? accessories : filters;
    return (src ?? []).map(i => ({
      id: i.id, brand: i.brand, model: i.model, image_url: i.image_url,
      url_manufacturer: (i as any).url_manufacturer ?? null
    }));
  }, [cat, cameras, telescopes, mounts, filters, accessories]);

  const tableName: TableName = `astro_${cat}` as TableName;
  const brands = useMemo(() => [...new Set(items.map(i => i.brand))].sort(), [items]);
  const { data: audit = {} } = useAuditStatuses(tableName);
  const setAuditMutation = useSetAuditStatus(tableName);

  // Ctrl+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset selection on category change
  useEffect(() => { setSelected(new Set()); setFocusId(null); }, [cat]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const cmdItems: AuditableItem[] = useMemo(() =>
    items.map(i => ({
      id: i.id,
      label: `${i.brand} ${i.model}`,
      sublabel: tableName,
      hasImage: !!i.image_url,
      status: audit[i.id],
    }))
  , [items, audit, tableName]);

  const handleCmdAction = useCallback((id: string, action: "ok" | "flag" | "replace" | "google" | "focus") => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const catWord = CAT_WORD[tableName] ?? "product";
    if (action === "ok") setAuditMutation.mutate({ targetId: id, status: "ok" });
    else if (action === "flag") setAuditMutation.mutate({ targetId: id, status: "flagged" });
    else if (action === "google") window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.brand} ${item.model} ${catWord} product photo`)}`, "_blank");
    else if (action === "focus") setFocusId(id);
    else if (action === "replace") setFocusId(id);
  }, [items, tableName, setAuditMutation]);

  // Batch actions
  const batchOk = () => { selected.forEach(id => setAuditMutation.mutate({ targetId: id, status: "ok" })); setSelected(new Set()); toast.success(`${selected.size} marqués OK`); };
  const batchFlag = () => { selected.forEach(id => setAuditMutation.mutate({ targetId: id, status: "flagged" })); setSelected(new Set()); toast.success(`${selected.size} signalés`); };
  const batchGoogle = () => {
    const catWord = CAT_WORD[tableName] ?? "product";
    let count = 0;
    selected.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item && count < 5) { window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.brand} ${item.model} ${catWord} product photo`)}`, "_blank"); count++; }
    });
    if (selected.size > 5) toast.info(`5 onglets ouverts sur ${selected.size} (limite navigateur)`);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher marque ou modèle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/30 border-border/50"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setCmdOpen(true)} className="gap-1.5 text-xs">
          <CommandIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Recherche rapide</span>
          <kbd className="ml-1 px-1 py-0.5 rounded bg-muted border border-border text-[9px]">⌘K</kbd>
        </Button>
      </div>

      <Tabs value={cat} onValueChange={setCat}>
        <TabsList>
          <TabsTrigger value="cameras" className="gap-1 text-xs"><Camera className="w-3 h-3" /> Caméras</TabsTrigger>
          <TabsTrigger value="telescopes" className="gap-1 text-xs"><Telescope className="w-3 h-3" /> Télescopes</TabsTrigger>
          <TabsTrigger value="mounts" className="gap-1 text-xs"><Anchor className="w-3 h-3" /> Montures</TabsTrigger>
          <TabsTrigger value="filters" className="gap-1 text-xs"><Filter className="w-3 h-3" /> Filtres</TabsTrigger>
          <TabsTrigger value="accessories" className="gap-1 text-xs"><Zap className="w-3 h-3" /> Accessoires</TabsTrigger>
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

      <ChipFilter label="Marque" options={brands} selected={brandFilter} onChange={setBrandFilter} />

      <AuditBatchBar
        count={selected.size}
        onOk={batchOk}
        onFlag={batchFlag}
        onGoogle={batchGoogle}
        onClear={() => setSelected(new Set())}
      />

      <AuditGrid items={items} tableName={tableName} filterStatus={filterStatus} brandFilter={brandFilter} searchQuery={searchQuery} selected={selected} onToggleSelect={toggleSelect} focusId={focusId} />

      <AuditCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} items={cmdItems} onAction={handleCmdAction} />
    </div>
  );
}
