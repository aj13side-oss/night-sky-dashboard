import { CelestialObject } from "@/hooks/useCelestialObjects";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { useObjectImage } from "@/hooks/useObjectImage";
import { getSeasonEmoji, getDisplaySeason } from "@/lib/dynamic-score";
import { getRarityColor } from "@/lib/rarity";
import { getSearchContext } from "@/lib/search-context";
import { motion } from "framer-motion";
import { Ruler, Eye, Award, Link, Lightbulb, Crosshair, BookOpen, ClipboardList } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatCatalogId } from "@/lib/format-catalog";
import { Button } from "@/components/ui/button";
import { useTonightList } from "@/hooks/useTonightList";
import { toast } from "sonner";

interface Props {
  obj: CelestialObject;
  index: number;
  lat: number;
  lng: number;
  searchQuery?: string;
  onClick: () => void;
  isTopPick?: boolean;
  maxAltInWindow?: number;
  sunset?: Date | null;
  astroDuskEnd?: Date | null;
  astroDawnBegin?: Date | null;
  sunrise?: Date | null;
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

// Returns a tailwind text color class for a given time based on solar context.
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
  // Helper: is tm in cyclic range [a, b) (minutes 0..1440), inclusive a, exclusive b
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
      // astronomical night: from de to db (cyclic)
      if (inRange(de, db)) return "text-emerald-400";
      // dusk/dawn (sun down but not astro night)
      if (inRange(ss, de) || inRange(db, sr)) return "text-orange-400";
      return "text-red-400";
    }
    // Fallback without astro bounds: night green between sunset and sunrise, else red
    if (inRange(ss, sr)) return "text-emerald-400";
    return "text-red-400";
  }
  return "text-muted-foreground";
}

const ObjectCard = ({ obj, index, lat, lng, searchQuery = "", onClick, isTopPick = false, maxAltInWindow, sunset, astroDuskEnd, astroDawnBegin, sunrise }: Props) => {
  const navigate = useNavigate();
  const { isInList, addObject, removeObject } = useTonightList();

  const rs = useMemo(() => {
    if (obj.ra_deg == null || obj.dec_deg == null) return null;
    return getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, lat, lng, new Date());
  }, [obj.ra_deg, obj.dec_deg, lat, lng]);

  const { data: wikiImage, isLoading: wikiLoading } = useObjectImage(
    obj.catalog_id,
    obj.common_name,
    obj.ra_deg,
    obj.dec_deg,
    obj.size_max,
    obj.image_search_query,
    obj.forced_image_url,
    obj.obj_type
  );

  const thumbUrl = wikiImage?.url || null;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const searchContext = useMemo(() => getSearchContext(obj, searchQuery), [obj, searchQuery]);
  const displayUrl = searchContext?.image
    ? searchContext.image
    : useFallback && wikiImage?.fallbackUrl ? wikiImage.fallbackUrl : thumbUrl;

  const score = computeDynamicScore(obj.photo_score, obj.best_months, obj.ra_deg, obj.dec_deg, lat, lng);
  const isLegendary = score.total >= 100;
  const season = getDisplaySeason(obj.best_months, obj.dec_deg, lat);
  const currentSeason = (() => {
    const m = new Date().getMonth(); // 0-11
    if (m === 11 || m <= 1) return "Winter";
    if (m <= 4) return "Spring";
    if (m <= 7) return "Summer";
    return "Autumn";
  })();
  const isPrime = season.isCircumpolar || (season.isSeason && season.label === currentSeason);

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
      {/* Thumbnail — object-cover to fill frame */}
      {(!imgError && (wikiLoading || displayUrl)) && (
        <div className="relative w-full h-28 bg-muted/30 overflow-hidden">
          {displayUrl && (
            <img
              src={displayUrl}
              alt={`${obj.common_name ?? obj.catalog_id} — ${obj.obj_type}${obj.constellation ? ` in ${obj.constellation}` : ''}`}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              width={400}
              height={112}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                if (!useFallback && wikiImage?.fallbackUrl) {
                  setUseFallback(true);
                  setImgLoaded(false);
                } else {
                  setImgError(true);
                }
              }}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {(!imgLoaded || wikiLoading) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!obj.forced_image_url && imgLoaded && !imgError && (
            <span className="absolute bottom-1 right-1 text-[8px] font-mono text-white/50 bg-black/40 px-1 rounded">
              DSS
            </span>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
            {obj.rarity && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg"
                style={{ backgroundColor: getRarityColor(obj.rarity), color: "#0F172A" }}
              >
                {obj.rarity}
              </div>
            )}
            {isLegendary && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/90 text-yellow-950 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                <Crown className="w-3 h-3" /> Legendary
              </div>
            )}
            {isPrime && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                <Award className="w-3 h-3" /> Prime
              </div>
            )}
          </div>

          {season.label && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-[10px] text-foreground font-medium">
              {season.isSeason ? `${getSeasonEmoji(season.label)} ${season.label}` : season.label}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Dynamic Score */}
        {obj.photo_score != null && (
          <div className="mb-3 space-y-1.5">
            <div className="flex items-end justify-between">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Accessibility Score</span>
              <div className="flex items-center gap-1.5">
                {score.altitudeBonus > 0 && (
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-medium">
                    <Mountain className="w-2.5 h-2.5" /> +{score.altitudeBonus}
                  </span>
                )}
                <span className={`font-mono font-bold text-xl leading-none ${scoreColor}`}>{score.total}</span>
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
              {typeEmoji[obj.obj_type] ?? "🔭"} {formatCatalogId(obj)}
              {isTopPick && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/90 text-yellow-950 text-[9px] font-bold">
                  🏆 Top Pick
                </span>
              )}
            </p>
            {obj.common_name && (
              <p className="text-xs text-primary truncate mt-0.5">{obj.common_name}</p>
            )}
            {obj.parent_id && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <Link className="w-3 h-3" /> Part of a larger region
              </p>
            )}
          </div>
        </div>

        {searchContext && (
          <div className="mb-3 p-2 bg-accent/30 border border-accent/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-accent-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-accent-foreground/80 line-clamp-3">{searchContext.description}</p>
            </div>
          </div>
        )}

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

        {rs && (
          <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-xs">
            {rs.isCircumpolar ? (
              <span className="font-medium text-emerald-400">Always visible</span>
            ) : rs.neverRises ? (
              <span className="font-medium text-red-400/80">Not visible tonight</span>
            ) : (
              <span className="font-mono">
                <span className={colorForTime(rs.riseTime, sunset, astroDuskEnd, astroDawnBegin, sunrise)}>
                  ↑ {formatTimeShort(rs.riseTime)}
                </span>
                <span className="text-muted-foreground"> · </span>
                <span className={colorForTime(rs.setTime, sunset, astroDuskEnd, astroDawnBegin, sunrise)}>
                  ↓ {formatTimeShort(rs.setTime)}
                </span>
              </span>
            )}
            {!rs.neverRises && (
              <span className="text-muted-foreground font-mono">peak {Math.round(rs.transitAlt)}°</span>
            )}
          </div>
        )}

        {maxAltInWindow != null && maxAltInWindow < 30 && (
          <div className="mt-1.5 text-[10px] text-muted-foreground/80 italic">
            Low — best above 30°
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-2 pt-2 border-t border-border/30 flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-[10px] h-7 gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); navigate(`/object/${encodeURIComponent(obj.catalog_id)}`); }}
          >
            <BookOpen className="w-3 h-3" /> More
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-[10px] h-7 gap-1 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/fov-calculator?target=${encodeURIComponent(obj.catalog_id)}`);
            }}
          >
            <Crosshair className="w-3 h-3" /> Frame
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-7 gap-1 text-muted-foreground hover:text-primary px-2"
            onClick={(e) => {
              e.stopPropagation();
              if (isInList(obj.catalog_id)) {
                removeObject(obj.catalog_id);
                toast("Removed from tonight's list");
              } else {
                addObject(obj.catalog_id);
                toast.success("Added to tonight's list!");
              }
            }}
          >
            <ClipboardList className={`w-3 h-3 ${isInList(obj.catalog_id) ? "text-primary" : ""}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ObjectCard;
