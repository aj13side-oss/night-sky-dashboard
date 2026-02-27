import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { useObjectImage } from "@/hooks/useObjectImage";
import { computeDynamicScore, getSeasonEmoji, getSeasonLabel } from "@/lib/dynamic-score";
import { motion } from "framer-motion";
import { Ruler, Eye, Crown, Award, Sun, Mountain } from "lucide-react";
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

  const { data: wikiImage, isLoading: wikiLoading } = useObjectImage(
    obj.catalog_id,
    obj.common_name,
    obj.ra,
    obj.dec,
    obj.size_max,
    obj.image_search_query,
    obj.forced_image_url
  );

  const thumbUrl = wikiImage?.url || null;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const score = computeDynamicScore(obj.photo_score, obj.best_months, obj.ra, obj.dec, lat, lng);
  const isLegendary = score.total >= 100;
  const isPrime = score.total >= 85 && score.total < 100;
  const season = getSeasonLabel(obj.best_months);

  // Dynamic score color
  const scoreColor = score.isHighAltitude
    ? "text-green-400"
    : score.isSeasonal
    ? "text-emerald-400"
    : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      onClick={onClick}
      className={`glass-card rounded-2xl overflow-hidden cursor-pointer transition-all group ${
        isLegendary ? "ring-1 ring-yellow-500/40 hover:ring-yellow-500/60" : isPrime ? "ring-1 ring-slate-300/20 hover:ring-slate-300/40" : "hover:border-primary/30"
      }`}
    >
      {/* Thumbnail with badges */}
      {(!imgError && (wikiLoading || thumbUrl)) && (
        <div className="relative w-full h-28 bg-muted/30 overflow-hidden">
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt={`${obj.catalog_id}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {(!imgLoaded || wikiLoading) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Tier badge */}
          {isLegendary && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/90 text-yellow-950 text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <Crown className="w-3 h-3" /> Legendary
            </div>
          )}
          {isPrime && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <Award className="w-3 h-3" /> Prime
            </div>
          )}

          {/* Season badge */}
          {season && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-[10px] text-foreground font-medium">
              {getSeasonEmoji(season)} {season}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Dynamic Score */}
        {obj.photo_score != null && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-medium uppercase tracking-wider">Tonight Score</span>
              <div className="flex items-center gap-1.5">
                {score.seasonalBonus > 0 && (
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                    <Sun className="w-2.5 h-2.5" /> +{score.seasonalBonus}
                  </span>
                )}
                {score.altitudeBonus > 0 && (
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                    <Mountain className="w-2.5 h-2.5" /> +{score.altitudeBonus}
                  </span>
                )}
                <span className={`font-mono font-bold ${scoreColor}`}>{score.total}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(score.total, 120) / 1.2}%`,
                  background: score.isHighAltitude
                    ? "linear-gradient(90deg, hsl(142 71% 45%), hsl(160 60% 45%))"
                    : score.total >= 80
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                    : score.total >= 50
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
