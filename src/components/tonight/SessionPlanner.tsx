import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObservation } from "@/contexts/ObservationContext";
import { useObjectImage } from "@/hooks/useObjectImage";
import { formatCatalogId } from "@/lib/format-catalog";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Trash2, GripVertical, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "cosmicframe_tonight_session";
const OVERHEAD_PER_TARGET_MIN = 10;

export interface SessionTarget {
  catalogId: string;
  exposureSec: number;
  numSubs: number;
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
  onUpdateTargets: (targets: SessionTarget[]) => void;
}

const SessionPlanner = ({ sessionIds, onRemove, onUpdateTargets }: SessionPlannerProps) => {
  const { date, location } = useObservation();
  const dateStr = date.toISOString().split("T")[0];
  const [targets, setTargets] = useState<SessionTarget[]>(() => loadSession(dateStr));
  const [collapsed, setCollapsed] = useState(false);

  // Sync when sessionIds change (new items added externally)
  useEffect(() => {
    setTargets((prev) => {
      const existing = new Set(prev.map((t) => t.catalogId));
      const newItems = sessionIds
        .filter((id) => !existing.has(id))
        .map((id) => ({ catalogId: id, exposureSec: 120, numSubs: 50 }));
      if (newItems.length === 0 && prev.length === sessionIds.length) return prev;
      const filtered = prev.filter((t) => sessionIds.includes(t.catalogId));
      return [...filtered, ...newItems];
    });
  }, [sessionIds]);

  useEffect(() => {
    saveSession(dateStr, targets);
    onUpdateTargets(targets);
  }, [targets, dateStr]);

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

  // Sort targets by transit time
  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const objA = objMap.get(a.catalogId);
      const objB = objMap.get(b.catalogId);
      if (!objA || !objB) return 0;
      const rsA = getObjectRiseSetTransit(objA.ra_deg!, objA.dec_deg!, location.lat, location.lng, date);
      const rsB = getObjectRiseSetTransit(objB.ra_deg!, objB.dec_deg!, location.lat, location.lng, date);
      const tA = rsA.transitTime?.getTime() ?? 0;
      const tB = rsB.transitTime?.getTime() ?? 0;
      return tA - tB;
    });
  }, [targets, objMap, location, date]);

  const totalMinutes = useMemo(() => {
    return targets.reduce((sum, t) => {
      return sum + (t.exposureSec * t.numSubs) / 60 + OVERHEAD_PER_TARGET_MIN;
    }, 0);
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
      return `${i + 1}. ${name} — ${t.numSubs}×${t.exposureSec}s (${totalMin}m)`;
    });
    lines.push(`\nTotal: ${Math.round(totalMinutes)}m (${(totalMinutes / 60).toFixed(1)}h)`);
    navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied!", description: "Session plan copied to clipboard." });
  };

  const handleClear = () => {
    sessionIds.forEach(onRemove);
    setTargets([]);
  };

  if (sessionIds.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center space-y-2">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Your imaging session is empty</p>
        <p className="text-xs text-muted-foreground">Click "+ Add to Session" on any target above</p>
      </div>
    );
  }

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
          <Badge variant="secondary" className="text-[10px]">{sessionIds.length} targets</Badge>
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
            <div className="p-4 space-y-2">
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

            {/* Summary */}
            <div className="px-4 py-3 border-t border-border/30 bg-secondary/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total session time:</span>
                <span className="font-mono font-semibold text-foreground">
                  {Math.round(totalMinutes)}m ({(totalMinutes / 60).toFixed(1)}h)
                </span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5" onClick={handleCopyToClipboard}>
                  <Copy className="w-3 h-3" /> Copy Plan
                </Button>
                <Button size="sm" variant="ghost" className="text-xs gap-1.5 text-destructive hover:text-destructive" onClick={handleClear}>
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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

  // Set default exposure based on object type
  useEffect(() => {
    if (obj && target.exposureSec === 120 && obj.obj_type) {
      const def = defaultExposure(obj.obj_type);
      if (def !== 120) onUpdate({ exposureSec: def });
    }
  }, [obj?.obj_type]);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5">
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Thumb */}
      <div className="w-10 h-10 rounded bg-muted/40 border border-border/30 overflow-hidden shrink-0">
        {img?.url && !imgError ? (
          <img src={img.url} className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground font-mono">DSO</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {obj ? formatCatalogId(obj) : target.catalogId}
        </p>
        {rs?.bestWindowStart && rs?.bestWindowEnd && (
          <p className="text-[9px] text-accent font-mono">
            {formatTimeShort(rs.bestWindowStart)} → {formatTimeShort(rs.bestWindowEnd)}
          </p>
        )}
      </div>

      {/* Exposure inputs */}
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="number"
          value={target.numSubs}
          onChange={(e) => onUpdate({ numSubs: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-14 h-7 text-[10px] text-center font-mono bg-secondary/50 px-1"
        />
        <span className="text-[9px] text-muted-foreground">×</span>
        <Input
          type="number"
          value={target.exposureSec}
          onChange={(e) => onUpdate({ exposureSec: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-14 h-7 text-[10px] text-center font-mono bg-secondary/50 px-1"
        />
        <span className="text-[9px] text-muted-foreground">s</span>
      </div>

      {/* Integration time */}
      <span className="text-[10px] font-mono text-muted-foreground w-12 text-right shrink-0">
        {integrationMin}m
      </span>

      {/* Remove */}
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default SessionPlanner;
