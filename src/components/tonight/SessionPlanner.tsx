import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObservation } from "@/contexts/ObservationContext";
import { useObjectImage } from "@/hooks/useObjectImage";
import { formatCatalogId } from "@/lib/format-catalog";
import { calculateAltitude } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X, Copy, Trash2, Clock, ChevronUp, ChevronDown, Search,
  Sparkles, Check, Loader2, ArrowUp, ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "cosmicframe_tonight_session";
const OVERHEAD_PER_TARGET_MIN = 10;

type TargetStatus = "queued" | "imaging" | "done";

export interface SessionTarget {
  catalogId: string;
  exposureSec: number;
  numSubs: number;
  status: TargetStatus;
  notes: string;
}

function defaultExposure(objType: string | null): number {
  if (!objType) return 120;
  const t = objType.toLowerCase();
  if (t.includes("nebula")) return 180;
  if (t.includes("galaxy")) return 120;
  if (t.includes("cluster")) return 60;
  return 120;
}

function loadSession(dateStr: string): SessionTarget[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (raw.date === dateStr) return raw.targets ?? [];
    return [];
  } catch { return []; }
}

function saveSession(dateStr: string, targets: SessionTarget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: dateStr, targets }));
}

interface SessionPlannerProps {
  sessionIds: string[];
  onRemove: (catalogId: string) => void;
  onAdd: (catalogId: string) => void;
  onUpdateTargets: (targets: SessionTarget[]) => void;
}

const SessionPlanner = ({ sessionIds, onRemove, onAdd, onUpdateTargets }: SessionPlannerProps) => {
  const { date, location } = useObservation();
  const dateStr = date.toISOString().split("T")[0];
  const [targets, setTargets] = useState<SessionTarget[]>(() => loadSession(dateStr));
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // Sync when sessionIds change (new items added externally)
  useEffect(() => {
    setTargets((prev) => {
      const existing = new Set(prev.map((t) => t.catalogId));
      const newItems = sessionIds
        .filter((id) => !existing.has(id))
        .map((id) => ({ catalogId: id, exposureSec: 120, numSubs: 50, status: "queued" as TargetStatus, notes: "" }));
      if (newItems.length === 0 && prev.length === sessionIds.length) return prev;
      const filtered = prev.filter((t) => sessionIds.includes(t.catalogId));
      return [...filtered, ...newItems];
    });
  }, [sessionIds]);

  useEffect(() => {
    saveSession(dateStr, targets);
    onUpdateTargets(targets);
  }, [targets, dateStr]);

  // Search for objects
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["planner-search", search],
    queryFn: async () => {
      if (search.trim().length < 2) return [];
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .or(`catalog_id.ilike.%${search}%,common_name.ilike.%${search}%`)
        .order("photo_score", { ascending: false })
        .limit(10);
      return (data ?? []) as CelestialObject[];
    },
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
  });

  // Auto-suggest top 5
  const { data: topTargets } = useQuery({
    queryKey: ["planner-suggest", location.lat, location.lng, date.toDateString()],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .gte("photo_score", 5)
        .not("ra_deg", "is", null)
        .not("dec_deg", "is", null)
        .order("photo_score", { ascending: false })
        .limit(100);
      const objs = (data ?? []) as CelestialObject[];
      return objs
        .filter((o) => {
          if (o.ra_deg == null || o.dec_deg == null) return false;
          const alt = calculateAltitude(o.ra_deg, o.dec_deg, location.lat, location.lng);
          return alt > 10;
        })
        .sort((a, b) => {
          const altA = calculateAltitude(a.ra_deg!, a.dec_deg!, location.lat, location.lng);
          const altB = calculateAltitude(b.ra_deg!, b.dec_deg!, location.lat, location.lng);
          return (b.photo_score ?? 0) + altB * 0.2 - ((a.photo_score ?? 0) + altA * 0.2);
        })
        .slice(0, 5);
    },
    staleTime: 60_000,
  });

  // Fetch objects for catalog IDs in session
  const { data: objects } = useQuery({
    queryKey: ["session-objects", sessionIds.join(",")],
    queryFn: async () => {
      if (sessionIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .in("catalog_id", sessionIds);
      return (data ?? []) as CelestialObject[];
    },
    enabled: sessionIds.length > 0,
  });

  const objMap = useMemo(() => {
    const map = new Map<string, CelestialObject>();
    objects?.forEach((o) => map.set(o.catalog_id, o));
    return map;
  }, [objects]);

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const objA = objMap.get(a.catalogId);
      const objB = objMap.get(b.catalogId);
      if (!objA || !objB) return 0;
      if (objA.ra_deg == null || objA.dec_deg == null || objB.ra_deg == null || objB.dec_deg == null) return 0;
      const rsA = getObjectRiseSetTransit(objA.ra_deg, objA.dec_deg, location.lat, location.lng, date);
      const rsB = getObjectRiseSetTransit(objB.ra_deg, objB.dec_deg, location.lat, location.lng, date);
      return (rsA.transitTime?.getTime() ?? 0) - (rsB.transitTime?.getTime() ?? 0);
    });
  }, [targets, objMap, location, date]);

  const totalMinutes = useMemo(() => {
    return targets.reduce((sum, t) => sum + (t.exposureSec * t.numSubs) / 60 + OVERHEAD_PER_TARGET_MIN, 0);
  }, [targets]);

  const updateTarget = useCallback((catalogId: string, update: Partial<SessionTarget>) => {
    setTargets((prev) => prev.map((t) => t.catalogId === catalogId ? { ...t, ...update } : t));
  }, []);

  const moveTarget = useCallback((catalogId: string, dir: -1 | 1) => {
    setTargets((prev) => {
      const idx = prev.findIndex((t) => t.catalogId === catalogId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  const handleCopyToClipboard = () => {
    const lines = sortedTargets.map((t, i) => {
      const obj = objMap.get(t.catalogId);
      const name = obj ? (obj.common_name ? `${obj.catalog_id} (${obj.common_name})` : obj.catalog_id) : t.catalogId;
      const totalMin = Math.round((t.exposureSec * t.numSubs) / 60);
      const rs = obj?.ra_deg != null && obj?.dec_deg != null
        ? getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, location.lat, location.lng, date)
        : null;
      const window = rs?.bestWindowStart && rs?.bestWindowEnd
        ? `${formatTimeShort(rs.bestWindowStart)}–${formatTimeShort(rs.bestWindowEnd)}`
        : "";
      const filter = obj?.recommended_filter ?? "RGB";
      return `${i + 1}. ${name} — ${t.numSubs}×${t.exposureSec}s (${totalMin}m)${window ? ` — ${window}` : ""} — ${filter} — ${t.status}`;
    });
    lines.push(`\nTotal: ${Math.round(totalMinutes)}m (${(totalMinutes / 60).toFixed(1)}h)`);
    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied!", description: "Session plan copied to clipboard." });
  };

  const handleClear = () => {
    sessionIds.forEach(onRemove);
    setTargets([]);
  };

  const autoSuggest = () => {
    if (!topTargets?.length) return;
    topTargets.forEach((o) => onAdd(o.catalog_id));
    toast({ title: "Added!", description: `Added ${topTargets.length} suggested targets` });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-secondary/30 cursor-pointer"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Session Planner</h3>
          {sessionIds.length > 0 && <Badge variant="secondary" className="text-[10px]">{sessionIds.length} targets</Badge>}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Search + Auto-suggest */}
            <div className="p-4 border-b border-border/30 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search target..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs bg-secondary/50"
                />
              </div>

              {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground mx-auto" />}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => { onAdd(obj.catalog_id); setSearch(""); }}
                      disabled={sessionIds.includes(obj.catalog_id)}
                      className="w-full text-left p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-[11px] disabled:opacity-40"
                    >
                      <span className="font-semibold text-foreground">{formatCatalogId(obj)}</span>
                      {obj.common_name && <span className="text-primary ml-1">— {obj.common_name}</span>}
                      <span className="text-muted-foreground ml-2">{obj.obj_type}</span>
                    </button>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" className="gap-1.5 text-[10px] w-full h-7" onClick={autoSuggest}>
                <Sparkles className="w-3 h-3" /> Auto-suggest Top 5
              </Button>
            </div>

            {/* Queue */}
            {sessionIds.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground">No targets yet</p>
                <p className="text-[10px] text-muted-foreground">Search above or click "+ Add to Session" on targets</p>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {sortedTargets.map((target, i) => (
                  <SessionRow
                    key={target.catalogId}
                    target={target}
                    obj={objMap.get(target.catalogId)}
                    index={i}
                    total={sortedTargets.length}
                    onUpdate={(u) => updateTarget(target.catalogId, u)}
                    onRemove={() => onRemove(target.catalogId)}
                    onMove={(dir) => moveTarget(target.catalogId, dir)}
                    location={location}
                    date={date}
                  />
                ))}
              </div>
            )}

            {/* Summary */}
            {sessionIds.length > 0 && (
              <div className="px-4 py-3 border-t border-border/30 bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total session:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {Math.round(totalMinutes)}m ({(totalMinutes / 60).toFixed(1)}h)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-[10px] gap-1 h-7" onClick={handleCopyToClipboard}>
                    <Copy className="w-3 h-3" /> Copy Plan
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[10px] gap-1 h-7 text-destructive hover:text-destructive" onClick={handleClear}>
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Session Row ── */

const statusColors: Record<TargetStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  imaging: "bg-primary/20 text-primary",
  done: "bg-green-500/20 text-green-400",
};

interface SessionRowProps {
  target: SessionTarget;
  obj: CelestialObject | undefined;
  index: number;
  total: number;
  onUpdate: (u: Partial<SessionTarget>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  location: { lat: number; lng: number };
  date: Date;
}

const SessionRow = ({ target, obj, index, total, onUpdate, onRemove, onMove, location, date }: SessionRowProps) => {
  const { data: img } = useObjectImage(
    target.catalogId, obj?.common_name ?? null, obj?.ra_deg ?? null, obj?.dec_deg ?? null,
    obj?.size_max ?? null, obj?.image_search_query ?? null, obj?.forced_image_url ?? null, obj?.obj_type ?? null
  );
  const [imgError, setImgError] = useState(false);

  const rs = obj?.ra_deg != null && obj?.dec_deg != null
    ? getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, location.lat, location.lng, date)
    : null;

  const integrationMin = Math.round((target.exposureSec * target.numSubs) / 60);

  useEffect(() => {
    if (obj && target.exposureSec === 120 && obj.obj_type) {
      const def = defaultExposure(obj.obj_type);
      if (def !== 120) onUpdate({ exposureSec: def });
    }
  }, [obj?.obj_type]);

  const cycleStatus = () => {
    const next: Record<TargetStatus, TargetStatus> = { queued: "imaging", imaging: "done", done: "queued" };
    onUpdate({ status: next[target.status] });
  };

  return (
    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5">
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ChevronUp className="w-3 h-3" />
        </button>
        <span className="text-[9px] text-muted-foreground font-mono text-center">{index + 1}</span>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Thumb */}
      <div className="w-9 h-9 rounded bg-muted/40 border border-border/30 overflow-hidden shrink-0">
        {img?.url && !imgError ? (
          <img src={img.url} className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground font-mono">DSO</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-foreground truncate">
            {obj ? formatCatalogId(obj) : target.catalogId}
            {obj?.common_name && <span className="text-primary font-normal ml-1">— {obj.common_name}</span>}
          </p>
          <button
            onClick={cycleStatus}
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors[target.status]}`}
          >
            {target.status === "done" && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
            {target.status}
          </button>
        </div>

        <div className="flex gap-2 text-[9px] text-muted-foreground font-mono">
          {rs?.bestWindowStart && rs?.bestWindowEnd && (
            <span>{formatTimeShort(rs.bestWindowStart)}→{formatTimeShort(rs.bestWindowEnd)}</span>
          )}
          {obj?.recommended_filter && <span>{obj.recommended_filter}</span>}
        </div>

        <input
          value={target.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Notes..."
          className="w-full text-[10px] bg-transparent border-b border-border/20 focus:border-primary/50 outline-none py-0.5 text-muted-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Exposure inputs */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Input
          type="number"
          value={target.numSubs}
          onChange={(e) => onUpdate({ numSubs: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 h-6 text-[9px] text-center font-mono bg-secondary/50 px-0.5"
        />
        <span className="text-[8px] text-muted-foreground">×</span>
        <Input
          type="number"
          value={target.exposureSec}
          onChange={(e) => onUpdate({ exposureSec: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 h-6 text-[9px] text-center font-mono bg-secondary/50 px-0.5"
        />
        <span className="text-[8px] text-muted-foreground">s</span>
      </div>

      <span className="text-[9px] font-mono text-muted-foreground w-10 text-right shrink-0">{integrationMin}m</span>

      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default SessionPlanner;
