import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useObservation } from "@/contexts/ObservationContext";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { useObjectImage } from "@/hooks/useObjectImage";
import { formatCatalogId } from "@/lib/format-catalog";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

const DeepSkyTonight = () => {
  const { location, date } = useObservation();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const navigate = useNavigate();

  const { data: objects, isLoading } = useQuery({
    queryKey: ["deep-sky-tonight", location.lat, location.lng, date.toDateString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("celestial_objects")
        .select("*")
        .gte("photo_score", 5)
        .not("ra_deg", "is", null)
        .not("dec_deg", "is", null)
        .order("photo_score", { ascending: false })
        .limit(200);
      return (data ?? []) as CelestialObject[];
    },
    staleTime: 60_000,
  });

  const ranked = useMemo(() => {
    if (!objects) return [];
    const now = date;
    return objects
      .map((obj) => {
        const alt = calculateAltitude(obj.ra_deg!, obj.dec_deg!, location.lat, location.lng, now);
        const rs = getObjectRiseSetTransit(obj.ra_deg!, obj.dec_deg!, location.lat, location.lng, now);
        return { obj, alt, rs };
      })
      .filter((item) => !item.rs.neverRises)
      .sort((a, b) => {
        // Prefer objects currently above horizon, then by altitude + photo_score
        const aUp = a.alt > 0 ? 1 : 0;
        const bUp = b.alt > 0 ? 1 : 0;
        if (aUp !== bUp) return bUp - aUp;
        const aScore = (a.obj.photo_score ?? 0) + Math.max(0, a.rs.transitAlt) * 0.3;
        const bScore = (b.obj.photo_score ?? 0) + Math.max(0, b.rs.transitAlt) * 0.3;
        return bScore - aScore;
      })
      .slice(0, 10);
  }, [objects, location.lat, location.lng, date]);

  const filtered = typeFilter === "all"
    ? ranked
    : ranked.filter((r) => {
        if (typeFilter === "galaxy") return r.obj.obj_type?.includes("Galaxy");
        if (typeFilter === "nebula") return r.obj.obj_type?.includes("Nebula");
        if (typeFilter === "cluster") return r.obj.obj_type?.includes("Cluster");
        return true;
      });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">✨ Deep Sky — Tonight's Best</h3>
        </div>
      </div>

      <div className="flex gap-1.5">
        {["all", "galaxy", "nebula", "cluster"].map((t) => (
          <Badge
            key={t}
            variant={typeFilter === t ? "default" : "secondary"}
            className="cursor-pointer text-[10px] capitalize"
            onClick={() => setTypeFilter(t)}
          >
            {t === "all" ? "All" : t}
          </Badge>
        ))}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map((item, i) => (
          <DeepSkyRow
            key={item.obj.id}
            obj={item.obj}
            alt={item.alt}
            rs={item.rs}
            index={i}
            onClick={() => navigate(`/sky-atlas`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No matching objects visible tonight</p>
      )}

      <div className="flex gap-2 mt-1">
        <Link to="/sky-atlas" className="flex-1">
          <Button variant="default" size="sm" className="w-full gap-2 text-xs">
            Browse Sky Atlas <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
        <Link to="/sky-atlas" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            Full Atlas <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const DeepSkyRow = ({
  obj,
  alt,
  rs,
  index,
  onClick,
}: {
  obj: CelestialObject;
  alt: number;
  rs: ReturnType<typeof getObjectRiseSetTransit>;
  index: number;
  onClick: () => void;
}) => {
  const { data: img } = useObjectImage(
    obj.catalog_id,
    obj.common_name,
    obj.ra_deg,
    obj.dec_deg,
    obj.size_max,
    obj.image_search_query,
    obj.forced_image_url,
    obj.obj_type
  );
  const [imgError, setImgError] = useState(false);
  const thumbUrl = img?.url;
  const isUp = alt > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/30 overflow-hidden shrink-0 flex-none">
        {thumbUrl && !imgError ? (
          <img
            src={thumbUrl}
            alt={obj.common_name ?? obj.catalog_id}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-mono">
            DSO
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {formatCatalogId(obj)}
          {obj.common_name && <span className="text-primary font-normal ml-1">— {obj.common_name}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {obj.obj_type} · {obj.constellation ?? "—"}
        </p>
      </div>

      <div className="text-right shrink-0 space-y-0.5">
        {obj.photo_score != null && (
          <Badge variant="secondary" className="text-[9px] font-mono">
            ★{obj.photo_score}
          </Badge>
        )}
        <p className="text-[10px] text-muted-foreground font-mono">
          {isUp ? `${alt.toFixed(0)}° alt` : `↑${formatTimeShort(rs.riseTime)}`}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono">
          {rs.isCircumpolar ? "All night" : rs.setTime ? `↓${formatTimeShort(rs.setTime)}` : ""}
        </p>
      </div>
    </motion.div>
  );
};

export default DeepSkyTonight;
