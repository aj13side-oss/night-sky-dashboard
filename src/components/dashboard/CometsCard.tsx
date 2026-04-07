import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Comet {
  id: string;
  full_name: string;
  status: string;
  status_note: string | null;
  is_visible: boolean;
  magnitude_current: number | null;
  magnitude_peak: number | null;
  magnitude_peak_date: string | null;
  current_constellation: string | null;
  constellation_path: string | null;
  sky_condition: string | null;
  observation_tool: string | null;
  elongation_deg: number | null;
  earth_distance_au: number | null;
  sun_distance_au: number | null;
  perihelion_date: string | null;
  perihelion_distance_au: number | null;
  earth_closest_date: string | null;
  earth_closest_au: number | null;
  comet_type: string | null;
  comet_family: string | null;
  discovery_date: string | null;
  discovered_by: string | null;
  visibility_start: string | null;
  visibility_end: string | null;
  visibility_category: string | null;
  northern_visibility: string | null;
  southern_visibility: string | null;
  description: string | null;
  link_theskylive: string | null;
  link_wikipedia_fr: string | null;
  link_wikipedia_en: string | null;
  last_data_update: string | null;
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  disintegrated: "bg-red-500",
  fading: "bg-orange-500",
};

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  disintegrated: { label: "Disintegrated", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  fading: { label: "Fading", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

const SKY_PILL: Record<string, { label: string; cls: string }> = {
  favorable: { label: "Favorable", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  difficult: { label: "Difficult", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  solar_glare: { label: "Solar glare", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  unknown: { label: "Unknown", cls: "bg-muted text-muted-foreground border-border" },
};

const TOOL_LABEL: Record<string, string> = {
  naked_eye: "Naked eye",
  binoculars: "Binoculars 10×50",
  telescope: "Telescope",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtDateShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CometRow({ c, onClick }: { c: Comet; onClick: () => void }) {
  const dot = STATUS_DOT[c.status] ?? "bg-muted";
  const sp = STATUS_PILL[c.status];
  const sky = c.sky_condition ? SKY_PILL[c.sky_condition] ?? SKY_PILL.unknown : null;
  const mag = c.magnitude_current != null ? `mag ${c.magnitude_current}` : c.magnitude_peak != null ? `~mag ${c.magnitude_peak}` : null;

  return (
    <div className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors group">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <button onClick={onClick} className="text-sm font-medium text-amber-400 hover:underline cursor-pointer text-left truncate flex-1 min-w-0">
        {c.full_name}
      </button>
      {c.current_constellation && (
        <span className="text-xs text-muted-foreground hidden sm:inline">{c.current_constellation}</span>
      )}
      {mag && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">{mag}</Badge>
      )}
      {sp && (
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sp.cls}`}>{sp.label}</Badge>
      )}
      {sky && (
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sky.cls} hidden md:inline-flex`}>{sky.label}</Badge>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground mt-0.5">{value}</dd>
    </div>
  );
}

function CometDetailModal({ comet, open, onClose }: { comet: Comet | null; open: boolean; onClose: () => void }) {
  if (!comet) return null;
  const c = comet;
  const sp = STATUS_PILL[c.status];
  const sky = c.sky_condition ? SKY_PILL[c.sky_condition] ?? SKY_PILL.unknown : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {c.full_name}
            {sp && <Badge variant="outline" className={`text-xs ${sp.cls}`}>{sp.label}</Badge>}
          </DialogTitle>
          {c.status_note && <DialogDescription>{c.status_note}</DialogDescription>}
        </DialogHeader>

        {/* Ephemeris */}
        {c.last_data_update && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ephemeris · JPL Horizons</h4>
            <dl className="grid grid-cols-2 gap-3">
              <DetailRow
                label="Current magnitude"
                value={c.magnitude_current != null ? (
                  <span>
                    <span className="text-lg font-bold text-amber-400">{c.magnitude_current}</span>
                    {c.observation_tool && <span className="text-xs text-muted-foreground ml-1">({TOOL_LABEL[c.observation_tool] ?? c.observation_tool})</span>}
                  </span>
                ) : null}
              />
              <DetailRow
                label="Solar elongation"
                value={c.elongation_deg != null ? (
                  <span>{c.elongation_deg}° {sky && <Badge variant="outline" className={`text-[10px] ml-1 ${sky.cls}`}>{sky.label}</Badge>}</span>
                ) : null}
              />
              <DetailRow label="Earth distance" value={c.earth_distance_au != null ? `${c.earth_distance_au} AU` : null} />
              <DetailRow label="Sun distance" value={c.sun_distance_au != null ? `${c.sun_distance_au} AU` : null} />
              <DetailRow label="Constellation" value={c.current_constellation ? <span className="text-amber-400">{c.current_constellation}</span> : null} />
              <DetailRow label="Path" value={c.constellation_path} />
            </dl>
          </div>
        )}

        {/* Orbit & Dates */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orbit & Dates</h4>
          <dl className="grid grid-cols-2 gap-3">
            <DetailRow label="Perihelion" value={c.perihelion_date ? <>{fmtDate(c.perihelion_date)}{c.perihelion_distance_au != null && <span className="text-xs text-muted-foreground ml-1">({c.perihelion_distance_au} AU)</span>}</> : null} />
            <DetailRow label="Closest Earth approach" value={c.earth_closest_date ? <>{fmtDate(c.earth_closest_date)}{c.earth_closest_au != null && <span className="text-xs text-muted-foreground ml-1">({c.earth_closest_au} AU)</span>}</> : null} />
            <DetailRow label="Type" value={c.comet_type ? <>{c.comet_type}{c.comet_family && <span className="text-muted-foreground"> · {c.comet_family}</span>}</> : null} />
            <DetailRow label="Discovery" value={c.discovery_date ? <>{fmtDate(c.discovery_date)}{c.discovered_by && <span className="text-muted-foreground text-xs ml-1">by {c.discovered_by}</span>}</> : null} />
            <DetailRow label="Peak magnitude" value={c.magnitude_peak != null ? <>{c.magnitude_peak}{c.magnitude_peak_date && <span className="text-xs text-muted-foreground ml-1">({fmtDateShort(c.magnitude_peak_date)})</span>}</> : null} />
            <DetailRow label="Observation window" value={c.visibility_start || c.visibility_end ? `${fmtDateShort(c.visibility_start)} → ${fmtDateShort(c.visibility_end)}` : null} />
          </dl>
        </div>

        {/* Visibility by hemisphere */}
        {(c.northern_visibility || c.southern_visibility) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility by hemisphere</h4>
            <dl className="grid grid-cols-2 gap-3">
              <DetailRow label="Northern Hemisphere" value={c.northern_visibility} />
              <DetailRow label="Southern Hemisphere" value={c.southern_visibility} />
            </dl>
          </div>
        )}

        {/* About */}
        {c.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
          </div>
        )}

        {/* Footer links */}
        {(c.link_theskylive || c.link_wikipedia_fr || c.link_wikipedia_en) && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border/30">
            {c.link_theskylive && <a href={c.link_theskylive} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline">TheSkyLive ↗</a>}
            {c.link_wikipedia_fr && <a href={c.link_wikipedia_fr} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline">Wikipedia FR ↗</a>}
            {c.link_wikipedia_en && <a href={c.link_wikipedia_en} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline">Wikipedia EN ↗</a>}
          </div>
        )}

        {/* Data freshness */}
        <p className="text-[10px] text-muted-foreground/60 pt-1">
          {c.last_data_update
            ? `JPL Horizons data · updated ${new Date(c.last_data_update).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${new Date(c.last_data_update).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`
            : "Static data · not yet refreshed by daily cron"}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default function CometsCard() {
  const [comets, setComets] = useState<Comet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Comet | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("comets" as any)
        .select("*")
        .order("is_visible", { ascending: false })
        .order("perihelion_date", { ascending: true });
      if (data) setComets(data as unknown as Comet[]);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 45 * 86400000);

  const visible = comets.filter(c => c.status === "active" && c.visibility_category !== "historical");
  const recent = comets.filter(c =>
    (c.status === "disintegrated" || c.status === "fading") &&
    c.visibility_category !== "historical" &&
    c.visibility_end &&
    new Date(c.visibility_end) >= cutoff
  );

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-5 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </motion.div>
    );
  }

  if (visible.length === 0 && recent.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          ☄️ Comets
        </h2>

        {visible.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Visible now</h3>
            {visible.map(c => <CometRow key={c.id} c={c} onClick={() => setSelected(c)} />)}
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Recently ended</h3>
            {recent.map(c => <CometRow key={c.id} c={c} onClick={() => setSelected(c)} />)}
          </div>
        )}
      </motion.div>

      <CometDetailModal comet={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
