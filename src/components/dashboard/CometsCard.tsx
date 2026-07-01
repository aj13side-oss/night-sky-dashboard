import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Telescope, ExternalLink } from "lucide-react";

interface Comet {
  id: string;
  full_name: string;
  short_name: string | null;
  status: string | null;
  magnitude_current: number | null;
  magnitude_peak: number | null;
  current_constellation: string | null;
  sky_condition: string | null;
  visibility_category: string | null;
  elongation_deg: number | null;
  earth_distance_au: number | null;
  perihelion_date: string | null;
  description: string | null;
  link_theskylive: string | null;
  is_visible: boolean | null;
}

const SKY: Record<string, { label: string; cls: string }> = {
  favorable: { label: "Favorable", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  difficult: { label: "Difficult", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  solar_glare: { label: "Solar glare", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  unknown: { label: "Unknown", cls: "bg-muted text-muted-foreground border-border" },
};

const CAT: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  upcoming: { label: "Upcoming", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  recently_ended: { label: "Recently ended", cls: "bg-muted text-muted-foreground border-border" },
};

const SKY_EXPLAIN: Record<string, string> = {
  favorable: "Comet is well placed in the night sky — observable under good conditions.",
  difficult: "Low altitude or limited window — observation will be challenging.",
  solar_glare: "Too close to the Sun — currently lost in solar glare.",
  unknown: "Sky conditions for this comet are not yet evaluated.",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const CometsCard = () => {
  const [comets, setComets] = useState<Comet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Comet | null>(null);

  useEffect(() => {
    (supabase as any)
      .from("comets")
      .select("id, full_name, short_name, status, magnitude_current, magnitude_peak, current_constellation, sky_condition, visibility_category, elongation_deg, earth_distance_au, perihelion_date, description, link_theskylive, is_visible")
      .in("visibility_category", ["active", "upcoming", "recently_ended"])
      .order("magnitude_current", { ascending: true })
      .then(({ data, error }: { data: Comet[] | null; error: unknown }) => {
        if (!error && data) {
          const sorted = [...data].sort((a, b) => {
            if (a.magnitude_current == null) return 1;
            if (b.magnitude_current == null) return -1;
            return Number(a.magnitude_current) - Number(b.magnitude_current);
          });
          setComets(sorted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeCount = comets.filter(c => c.visibility_category === "active" || c.visibility_category === "upcoming").length;

  if (loading) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-semibold text-foreground mb-4">☄️ Comets</h2>
        <Card className="glass-card border-border/30">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-foreground">☄️ Comets</h2>
          {activeCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              {activeCount} active
            </Badge>
          )}
        </div>

        {comets.length === 0 ? (
          <Card className="glass-card border-border/30">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No notable comets currently visible
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-border/30">
            <CardContent className="p-2 sm:p-3 divide-y divide-border/20">
              {comets.map((c) => {
                const sky = c.sky_condition ? (SKY[c.sky_condition] ?? SKY.unknown) : null;
                const cat = c.visibility_category ? CAT[c.visibility_category] : null;
                const mag = c.magnitude_current != null ? Number(c.magnitude_current) : c.magnitude_peak != null ? Number(c.magnitude_peak) : null;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-muted/30 rounded-lg transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-amber-400 flex-1 min-w-0 truncate">
                      {c.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 shrink-0">
                      <Telescope className="w-3 h-3" />
                      {mag != null ? `mag ${mag.toFixed(1)}` : "—"}
                    </span>
                    {c.current_constellation && (
                      <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                        {c.current_constellation}
                      </span>
                    )}
                    {sky && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${sky.cls}`}>
                        {sky.label}
                      </Badge>
                    )}
                    {cat && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 hidden md:inline-flex ${cat.cls}`}>
                        {cat.label}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </motion.section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap pr-6">
                  {selected.full_name}
                  {selected.visibility_category && CAT[selected.visibility_category] && (
                    <Badge variant="outline" className={`text-xs ${CAT[selected.visibility_category].cls}`}>
                      {CAT[selected.visibility_category].label}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selected.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                )}

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Perihelion date</dt>
                    <dd className="text-foreground mt-0.5">{fmtDate(selected.perihelion_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Earth distance</dt>
                    <dd className="text-foreground mt-0.5">
                      {selected.earth_distance_au != null ? `${selected.earth_distance_au} AU` : "—"}
                    </dd>
                  </div>
                  {selected.current_constellation && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Constellation</dt>
                      <dd className="text-amber-400 mt-0.5">{selected.current_constellation}</dd>
                    </div>
                  )}
                  {(selected.magnitude_current ?? selected.magnitude_peak) != null && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Magnitude</dt>
                      <dd className="text-foreground mt-0.5">
                        {selected.magnitude_current ?? selected.magnitude_peak}
                      </dd>
                    </div>
                  )}
                </dl>

                {selected.sky_condition && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sky condition</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${(SKY[selected.sky_condition] ?? SKY.unknown).cls}`}>
                        {(SKY[selected.sky_condition] ?? SKY.unknown).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {SKY_EXPLAIN[selected.sky_condition] ?? SKY_EXPLAIN.unknown}
                    </p>
                  </div>
                )}

                {selected.link_theskylive && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={selected.link_theskylive} target="_blank" rel="noopener noreferrer">
                      View on TheSkyLive
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CometsCard;
