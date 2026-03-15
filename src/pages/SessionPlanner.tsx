import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { useCurrentUser } from "@/hooks/useUserRigs";
import { calculateAltitude } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { formatCatalogId } from "@/lib/format-catalog";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ClipboardList, Trash2, X, GripVertical, Search, Sparkles,
  Moon, Sun, Copy, ArrowUp, ArrowDown, Check, Loader2,
} from "lucide-react";

const STORAGE_KEY = "cosmicframe_session_plan";

interface PlanTarget {
  catalog_id: string;
  notes: string;
  status: "queued" | "imaging" | "done";
  sort_order: number;
}

interface SessionPlan {
  date: string;
  targets: PlanTarget[];
}

function loadPlan(): SessionPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const plan: SessionPlan = JSON.parse(raw);
      const today = new Date().toISOString().split("T")[0];
      if (plan.date === today) return plan;
    }
  } catch {}
  return { date: new Date().toISOString().split("T")[0], targets: [] };
}

function savePlan(plan: SessionPlan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

const PlannerContent = () => {
  const { location, date } = useObservation();
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const [plan, setPlan] = useState<SessionPlan>(loadPlan);
  const [search, setSearch] = useState("");

  useEffect(() => { savePlan(plan); }, [plan]);

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

  // Fetch full objects for the queue
  const catalogIds = plan.targets.map((t) => t.catalog_id);
  const { data: queueObjects } = useQuery({
    queryKey: ["planner-queue", catalogIds.join(",")],
    queryFn: async () => {
      if (!catalogIds.length) return [];
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .in("catalog_id", catalogIds);
      return (data ?? []) as CelestialObject[];
    },
    enabled: catalogIds.length > 0,
    staleTime: 60_000,
  });

  // Auto-suggest top 5
  const { data: topTargets } = useQuery({
    queryKey: ["planner-suggest", location.lat, location.lng, date.toDateString()],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .gte("photo_score", 5)
        .not("ra", "is", null)
        .not("dec", "is", null)
        .order("photo_score", { ascending: false })
        .limit(100);
      const objs = (data ?? []) as CelestialObject[];
      return objs
        .filter((o) => {
          const alt = calculateAltitude(o.ra!, o.dec!, location.lat, location.lng);
          return alt > 10;
        })
        .sort((a, b) => {
          const altA = calculateAltitude(a.ra!, a.dec!, location.lat, location.lng);
          const altB = calculateAltitude(b.ra!, b.dec!, location.lat, location.lng);
          return (b.photo_score ?? 0) + altB * 0.2 - ((a.photo_score ?? 0) + altA * 0.2);
        })
        .slice(0, 5);
    },
    staleTime: 60_000,
  });

  const addTarget = useCallback((catalogId: string) => {
    setPlan((prev) => {
      if (prev.targets.some((t) => t.catalog_id === catalogId)) return prev;
      return {
        ...prev,
        targets: [...prev.targets, { catalog_id: catalogId, notes: "", status: "queued", sort_order: prev.targets.length }],
      };
    });
  }, []);

  const removeTarget = useCallback((catalogId: string) => {
    setPlan((prev) => ({ ...prev, targets: prev.targets.filter((t) => t.catalog_id !== catalogId) }));
  }, []);

  const updateTarget = useCallback((catalogId: string, updates: Partial<PlanTarget>) => {
    setPlan((prev) => ({
      ...prev,
      targets: prev.targets.map((t) => (t.catalog_id === catalogId ? { ...t, ...updates } : t)),
    }));
  }, []);

  const moveTarget = useCallback((idx: number, dir: -1 | 1) => {
    setPlan((prev) => {
      const t = [...prev.targets];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= t.length) return prev;
      [t[idx], t[newIdx]] = [t[newIdx], t[idx]];
      return { ...prev, targets: t };
    });
  }, []);

  const autoSuggest = () => {
    if (!topTargets?.length) return;
    topTargets.forEach((o) => addTarget(o.catalog_id));
    toast.success(`Added ${topTargets.length} suggested targets`);
  };

  const addFromFavorites = () => {
    toast("Favorites have been removed from the app");
  };

  const copyPlan = () => {
    if (!queueObjects?.length) return;
    const lines = plan.targets.map((t, i) => {
      const obj = queueObjects.find((o) => o.catalog_id === t.catalog_id);
      if (!obj) return `${i + 1}. ${t.catalog_id}`;
      const rs = obj.ra != null && obj.dec != null
        ? getObjectRiseSetTransit(obj.ra, obj.dec, location.lat, location.lng, date)
        : null;
      const window = rs?.bestWindowStart && rs?.bestWindowEnd
        ? `${formatTimeShort(rs.bestWindowStart)} - ${formatTimeShort(rs.bestWindowEnd)}`
        : "—";
      const filter = obj.recommended_filter ?? "RGB";
      return `${i + 1}. ${formatCatalogId(obj)}${obj.common_name ? ` — ${obj.common_name}` : ""} (${window}) — ${filter}`;
    });

    const text = [
      `Cosmic Frame — Session Plan — ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      `Location: ${location.name}`,
      "",
      ...lines,
    ].join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Plan copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead title="Session Planner" description="Plan your astrophotography night. Build a target queue, track progress, and export your imaging plan." path="/planner" />
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-primary" /> Session Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — {location.name}
          </p>
        </motion.div>

        {/* Night overview bar */}
        <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Tonight's session</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">{location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={copyPlan} disabled={!plan.targets.length}>
              <Copy className="w-3 h-3" /> Copy Plan
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive" onClick={() => setPlan({ date: plan.date, targets: [] })} disabled={!plan.targets.length}>
              <Trash2 className="w-3 h-3" /> Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imaging Queue */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Imaging Queue</h2>
            {plan.targets.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No targets yet. Search or auto-suggest to build your queue.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {plan.targets.map((target, idx) => {
                  const obj = queueObjects?.find((o) => o.catalog_id === target.catalog_id);
                  return (
                    <QueueItem
                      key={target.catalog_id}
                      target={target}
                      obj={obj ?? null}
                      index={idx}
                      total={plan.targets.length}
                      lat={location.lat}
                      lng={location.lng}
                      onRemove={() => removeTarget(target.catalog_id)}
                      onUpdate={(u) => updateTarget(target.catalog_id, u)}
                      onMove={(dir) => moveTarget(idx, dir)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Add Targets */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Add Targets</h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or catalog ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>

            {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {searchResults.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => { addTarget(obj.catalog_id); setSearch(""); }}
                    disabled={plan.targets.some((t) => t.catalog_id === obj.catalog_id)}
                    className="w-full text-left p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs disabled:opacity-40"
                  >
                    <span className="font-semibold text-foreground">{formatCatalogId(obj)}</span>
                    {obj.common_name && <span className="text-primary ml-1">— {obj.common_name}</span>}
                    <span className="text-muted-foreground ml-2">{obj.obj_type}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-xs w-full" onClick={autoSuggest}>
                <Sparkles className="w-3.5 h-3.5" /> Auto-suggest Top 5
              </Button>
              {userId && (
                <Button variant="outline" size="sm" className="gap-2 text-xs w-full" onClick={addFromFavorites}>
                  <Heart className="w-3.5 h-3.5" /> Add from Favorites
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const QueueItem = ({
  target, obj, index, total, lat, lng, onRemove, onUpdate, onMove,
}: {
  target: PlanTarget;
  obj: CelestialObject | null;
  index: number;
  total: number;
  lat: number;
  lng: number;
  onRemove: () => void;
  onUpdate: (u: Partial<PlanTarget>) => void;
  onMove: (dir: -1 | 1) => void;
}) => {
  const rs = obj?.ra != null && obj?.dec != null
    ? getObjectRiseSetTransit(obj.ra, obj.dec, lat, lng, new Date())
    : null;
  const alt = obj?.ra != null && obj?.dec != null
    ? calculateAltitude(obj.ra, obj.dec, lat, lng)
    : null;
  const { data: img } = useObjectImage(
    obj?.catalog_id, obj?.common_name, obj?.ra, obj?.dec,
    obj?.size_max, obj?.image_search_query, obj?.forced_image_url, obj?.obj_type
  );
  const [imgErr, setImgErr] = useState(false);

  const statusColors: Record<string, string> = {
    queued: "bg-muted text-muted-foreground",
    imaging: "bg-primary/20 text-primary",
    done: "bg-green-500/20 text-green-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card rounded-xl p-3 flex gap-3 items-start"
    >
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 pt-1">
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ArrowUp className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-muted-foreground font-mono text-center">{index + 1}</span>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-muted/40 overflow-hidden shrink-0">
        {img?.url && !imgErr ? (
          <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground font-mono">DSO</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {obj ? formatCatalogId(obj) : target.catalog_id}
            {obj?.common_name && <span className="text-primary font-normal ml-1">— {obj.common_name}</span>}
          </p>
          <button
            onClick={() => onUpdate({ status: target.status === "queued" ? "imaging" : target.status === "imaging" ? "done" : "queued" })}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[target.status]}`}
          >
            {target.status === "done" && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
            {target.status}
          </button>
        </div>

        <div className="flex gap-3 text-[10px] text-muted-foreground font-mono">
          {alt != null && <span>{alt.toFixed(0)}° alt</span>}
          {rs?.bestWindowStart && rs?.bestWindowEnd && (
            <span>Best: {formatTimeShort(rs.bestWindowStart)}–{formatTimeShort(rs.bestWindowEnd)}</span>
          )}
          {obj?.recommended_filter && <span>Filter: {obj.recommended_filter}</span>}
        </div>

        <input
          value={target.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Notes..."
          className="w-full text-[11px] bg-transparent border-b border-border/30 focus:border-primary/50 outline-none py-0.5 text-muted-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Remove */}
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

const SessionPlanner = () => (
  <ObservationProvider>
    <PlannerContent />
  </ObservationProvider>
);

export default SessionPlanner;
