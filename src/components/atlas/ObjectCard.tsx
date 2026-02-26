import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { motion } from "framer-motion";
import { Star, Ruler, Eye } from "lucide-react";

interface Props {
  obj: CelestialObject;
  index: number;
  lat: number;
  lng: number;
  onClick: () => void;
}

const typeEmoji: Record<string, string> = {
  Galaxy: "🌀",
  "Planetary Nebula": "🟣",
  "Emission Nebula": "🔴",
  "Reflection Nebula": "🔵",
  "Dark Nebula": "⚫",
  "Open Cluster": "✨",
  "Globular Cluster": "🟡",
  "Spiral Galaxy": "🌀",
  "Elliptical Galaxy": "🟠",
  Planet: "🪐",
};

const ObjectCard = ({ obj, index, lat, lng, onClick }: Props) => {
  const alt =
    obj.ra != null && obj.dec != null
      ? calculateAltitude(obj.ra, obj.dec, lat, lng)
      : null;
  const vis = alt != null ? getVisibilityLabel(alt) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      onClick={onClick}
      className="glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {typeEmoji[obj.obj_type] ?? "🔭"} {obj.catalog_id}
          </p>
          {obj.common_name && (
            <p className="text-xs text-primary truncate mt-0.5">{obj.common_name}</p>
          )}
        </div>
        {obj.photo_score != null && (
          <div className="shrink-0 flex items-center gap-1 text-xs font-mono bg-primary/15 text-primary rounded-full px-2 py-0.5">
            <Star className="w-3 h-3" />
            {obj.photo_score}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
        <span className="truncate">{obj.obj_type}</span>
        <span className="text-right truncate">{obj.constellation ?? "—"}</span>

        {obj.magnitude != null && (
          <>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> mag {obj.magnitude.toFixed(1)}
            </span>
            {obj.size_max != null && (
              <span className="text-right flex items-center gap-1 justify-end">
                <Ruler className="w-3 h-3" /> {obj.size_max.toFixed(1)}'
              </span>
            )}
          </>
        )}
      </div>

      {vis && alt != null && (
        <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between text-xs">
          <span className={`font-medium ${vis.color}`}>{vis.label}</span>
          <span className="text-muted-foreground font-mono">{alt.toFixed(1)}° alt</span>
        </div>
      )}
    </motion.div>
  );
};

export default ObjectCard;
