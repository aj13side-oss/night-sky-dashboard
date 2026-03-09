import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useTonightTopPicks } from "@/hooks/useTonightTopPicks";
import { getSkyImageUrl } from "@/lib/sky-images";
import { getSeasonEmoji, getSeasonLabel, getCurrentSeason } from "@/lib/dynamic-score";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Sun, Mountain } from "lucide-react";
import { formatCatalogId } from "@/lib/format-catalog";

interface Props {
  lat: number;
  lng: number;
  onSelect: (obj: CelestialObject) => void;
}

const TonightTopPicks = ({ lat, lng, onSelect }: Props) => {
  const { topPicks, isLoading } = useTonightTopPicks(lat, lng, 3);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Tonight's Top Picks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (topPicks.length === 0) return null;

  const currentSeason = getCurrentSeason();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Top Recommendations for Your Sky
        </h2>
        <span className="text-xs text-muted-foreground">
          {getSeasonEmoji(currentSeason)} {currentSeason} · Dynamic ranking
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topPicks.map(({ obj, score }, i) => {
          const thumbUrl = getSkyImageUrl(obj.ra, obj.dec, obj.size_max, 400, 200);
          const alt = obj.ra != null && obj.dec != null ? calculateAltitude(obj.ra, obj.dec, lat, lng) : null;
          const vis = alt != null ? getVisibilityLabel(alt) : null;
          const season = getSeasonLabel(obj.best_months);

          return (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(obj)}
              className="relative glass-card rounded-2xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all group"
            >
              {/* Background image */}
              {thumbUrl && (
                <div className="absolute inset-0">
                  <img
                    src={thumbUrl}
                    alt={obj.catalog_id}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>
              )}

              {/* Rank badge */}
              <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
                #{i + 1}
              </div>

              {/* Content */}
              <div className="relative p-4 pt-12 space-y-2">
                <p className="text-sm font-bold text-foreground truncate">
                  {formatCatalogId(obj)}
                </p>
                {obj.common_name && (
                  <p className="text-xs text-primary truncate">{obj.common_name}</p>
                )}

                {/* Dynamic score breakdown */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-lg font-black font-mono ${
                    score.isHighAltitude ? "text-green-400" : score.isSeasonal ? "text-emerald-400" : "text-primary"
                  }`}>
                    {score.total}
                  </span>
                  <span className="text-[10px] text-muted-foreground">pts</span>

                  {score.seasonalBonus > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      <Sun className="w-2.5 h-2.5" /> +{score.seasonalBonus}
                    </span>
                  )}
                  {score.altitudeBonus > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                      <Mountain className="w-2.5 h-2.5" /> +{score.altitudeBonus}
                    </span>
                  )}
                </div>

                {/* Season + visibility */}
                <div className="flex items-center justify-between text-[10px]">
                  {season && (
                    <span className="text-muted-foreground">
                      {getSeasonEmoji(season)} Best in {season}
                    </span>
                  )}
                  {vis && alt != null && (
                    <span className={`font-medium ${vis.color}`}>
                      {vis.label} · {alt.toFixed(0)}°
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TonightTopPicks;
