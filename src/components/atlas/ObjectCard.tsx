import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { getSkyImageUrl } from "@/lib/sky-images";
import { motion } from "framer-motion";
import { Ruler, Eye } from "lucide-react";
import { useState } from "react";

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
  const thumbUrl = getSkyImageUrl(obj.ra, obj.dec, obj.size_max, 200, 200);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      onClick={onClick}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all group"
    >
      {/* Sky thumbnail */}
      {thumbUrl && !imgError && (
        <div className="relative w-full h-28 bg-muted/30 overflow-hidden">
          <img
            src={thumbUrl}
            alt={`${obj.catalog_id} sky view`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      <div className="p-4">
      {/* Pro-Target Score */}
      {obj.photo_score != null && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground font-medium uppercase tracking-wider">Pro-Target Score</span>
            <span className="font-mono font-bold text-primary">{obj.photo_score}/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(obj.photo_score, 100)}%`,
                background: obj.photo_score >= 80
                  ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                  : obj.photo_score >= 50
                  ? "hsl(var(--primary) / 0.7)"
                  : "hsl(var(--muted-foreground) / 0.5)",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {typeEmoji[obj.obj_type] ?? "🔭"} {obj.catalog_id}
          </p>
          {obj.common_name && (
            <p className="text-xs text-primary truncate mt-0.5">{obj.common_name}</p>
          )}
        </div>
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
      </div>
    </motion.div>
  );
};

export default ObjectCard;
