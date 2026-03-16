import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { formatCatalogId } from "@/lib/format-catalog";
import { RiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, Telescope, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";

interface TonightTargetCardProps {
  obj: CelestialObject;
  rs: RiseSetTransit;
  alt: number;
  moonIllumination: number;
  isInSession: boolean;
  onAddToSession: () => void;
  index: number;
}

function moonToleranceLabel(val: number | null): { label: string; color: string } {
  if (val === null) return { label: "Unknown", color: "text-muted-foreground" };
  if (val >= 4) return { label: "High", color: "text-green-400" };
  if (val >= 2) return { label: "Medium", color: "text-primary" };
  return { label: "Low", color: "text-orange-400" };
}

const TonightTargetCard = ({ obj, rs, alt, moonIllumination, isInSession, onAddToSession, index }: TonightTargetCardProps) => {
  const { data: img } = useObjectImage(
    obj.catalog_id, obj.common_name, obj.ra_deg, obj.dec_deg,
    obj.size_max, obj.image_search_query, obj.forced_image_url, obj.obj_type
  );
  const [imgError, setImgError] = useState(false);
  const moonTol = moonToleranceLabel(obj.moon_tolerance);
  const isUp = alt > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-xl p-4 space-y-3"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-muted/40 border border-border/30 overflow-hidden shrink-0">
          {img?.url && !imgError ? (
            <img src={img.url} alt={obj.common_name ?? obj.catalog_id} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-mono">DSO</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {formatCatalogId(obj)}
            {obj.common_name && <span className="text-primary font-normal ml-1.5">— {obj.common_name}</span>}
          </h4>
          <p className="text-[11px] text-muted-foreground">{obj.obj_type} · {obj.constellation ?? "—"}</p>

          <div className="flex flex-wrap gap-1.5">
            {obj.photo_score != null && (
              <Badge variant="secondary" className="text-[9px] font-mono">★{obj.photo_score}</Badge>
            )}
            {moonIllumination > 50 && (
              <Badge variant="outline" className={`text-[9px] ${moonTol.color}`}>
                🌙 {moonTol.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-[9px] text-muted-foreground">Rise</p>
          <p className="text-xs font-mono text-foreground">{rs.isCircumpolar ? "Circ." : formatTimeShort(rs.riseTime)}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-[9px] text-muted-foreground">Transit</p>
          <p className="text-xs font-mono text-foreground">{formatTimeShort(rs.transitTime)} · {rs.transitAlt.toFixed(0)}°</p>
        </div>
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-[9px] text-muted-foreground">Set</p>
          <p className="text-xs font-mono text-foreground">{rs.isCircumpolar ? "Circ." : formatTimeShort(rs.setTime)}</p>
        </div>
      </div>

      {/* Best window */}
      {rs.bestWindowStart && rs.bestWindowEnd && (
        <p className="text-[10px] text-accent font-mono text-center">
          Best window: {formatTimeShort(rs.bestWindowStart)} → {formatTimeShort(rs.bestWindowEnd)} (above 30°)
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isInSession ? "secondary" : "default"}
          className="flex-1 text-xs gap-1.5"
          onClick={onAddToSession}
          disabled={isInSession}
        >
          {isInSession ? <><Check className="w-3 h-3" /> In Session</> : <><Plus className="w-3 h-3" /> Add to Session</>}
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1" asChild>
          <Link to={`/sky-atlas`}>
            <Telescope className="w-3 h-3" /> Atlas
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1" asChild>
          <Link to={`/fov-calculator`}>
            <Crosshair className="w-3 h-3" /> FOV
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default TonightTargetCard;
