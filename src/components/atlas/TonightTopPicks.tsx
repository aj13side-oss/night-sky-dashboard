import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useTonightTopPicks } from "@/hooks/useTonightTopPicks";
import { getSkyImageUrl } from "@/lib/sky-images";
import { getSeasonEmoji, getDisplaySeason, getCurrentSeason } from "@/lib/dynamic-score";
import { getRarityColor } from "@/lib/rarity";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { motion } from "framer-motion";
import { Sparkles, Sun, Mountain } from "lucide-react";
import { formatCatalogId } from "@/lib/format-catalog";
import { useTranslation } from "react-i18next";

interface Props {
  lat: number;
  lng: number;
  onSelect: (obj: CelestialObject) => void;
  sunset?: Date | null;
  astroDuskEnd?: Date | null;
  astroDawnBegin?: Date | null;
  sunrise?: Date | null;
}

function colorForTime(
  t: Date | null,
  sunset?: Date | null,
  astroDuskEnd?: Date | null,
  astroDawnBegin?: Date | null,
  sunrise?: Date | null,
): string {
  if (!t) return "text-muted-foreground";
  const toMin = (d: Date) => d.getHours() * 60 + d.getMinutes();
  const tm = toMin(t);
  const inRange = (a: number, b: number) => {
    if (a === b) return false;
    if (a < b) return tm >= a && tm < b;
    return tm >= a || tm < b;
  };
  if (sunset && sunrise) {
    const ss = toMin(sunset);
    const sr = toMin(sunrise);
    if (astroDuskEnd && astroDawnBegin) {
      const de = toMin(astroDuskEnd);
      const db = toMin(astroDawnBegin);
      if (inRange(de, db)) return "text-emerald-400";
      if (inRange(ss, de) || inRange(db, sr)) return "text-orange-400";
      return "text-red-400";
    }
    if (inRange(ss, sr)) return "text-emerald-400";
    return "text-red-400";
  }
  return "text-muted-foreground";
}

const TonightTopPicks = ({ lat, lng, onSelect, sunset, astroDuskEnd, astroDawnBegin, sunrise }: Props) => {
  const { t: tr } = useTranslation("atlas");
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
          const thumbUrl = getSkyImageUrl(obj.ra_deg, obj.dec_deg, obj.size_max, 400, 200);
          const rs = obj.ra_deg != null && obj.dec_deg != null
            ? getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, lat, lng, new Date())
            : null;
          const season = getDisplaySeason(obj.best_months, obj.dec_deg, lat);

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
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={160}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>
              )}

              {/* Rank badge */}
              <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
                #{i + 1}
              </div>

              {/* Rarity badge */}
              {obj.rarity && (
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg"
                  style={{ backgroundColor: getRarityColor(obj.rarity), color: "#0F172A" }}
                >
                  {obj.rarity}
                </div>
              )}

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

                  {score.altitudeBonus > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                      <Mountain className="w-2.5 h-2.5" /> +{score.altitudeBonus}
                    </span>
                  )}
                </div>

                {/* Season + visibility */}
                <div className="flex items-center justify-between text-[10px] gap-2">
                  {season.label && (
                    <span className="text-muted-foreground truncate">
                      {season.isSeason ? `${getSeasonEmoji(season.label)} Best in ${season.label}` : season.label}
                    </span>
                  )}
                  {rs && (
                    rs.isCircumpolar ? (
                      <span className="font-medium text-emerald-400">Always visible</span>
                    ) : rs.neverRises ? (
                      <span className="font-medium text-red-400/80">Not visible</span>
                    ) : (
                      <span className="font-mono whitespace-nowrap">
                        <span className={colorForTime(rs.riseTime, sunset, astroDuskEnd, astroDawnBegin, sunrise)}>
                          ↑ {formatTimeShort(rs.riseTime)}
                        </span>
                        <span className="text-muted-foreground"> · </span>
                        <span className={colorForTime(rs.setTime, sunset, astroDuskEnd, astroDawnBegin, sunrise)}>
                          ↓ {formatTimeShort(rs.setTime)}
                        </span>
                      </span>
                    )
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
