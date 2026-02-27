import { useMemo, useState } from "react";
import { DARK_SITES, distanceKm, DarkSite } from "@/lib/dark-sites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Star, Navigation, MapPin } from "lucide-react";

interface Props {
  userLat: number;
  userLng: number;
  onSelectSite: (site: DarkSite) => void;
}

const DarkSitesFinder = ({ userLat, userLng, onSelectSite }: Props) => {
  const [maxRadius, setMaxRadius] = useState([500]);

  const nearbySites = useMemo(() => {
    return DARK_SITES
      .map((site) => ({ ...site, distance: distanceKm(userLat, userLng, site.lat, site.lng) }))
      .filter((s) => s.distance <= maxRadius[0])
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [userLat, userLng, maxRadius]);

  const bortleColor = (b: number) => {
    if (b <= 1) return "text-green-400";
    if (b <= 2) return "text-emerald-400";
    return "text-primary";
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Nearby Dark Sites</h3>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Radius: {maxRadius[0]} km</Label>
        <Slider value={maxRadius} onValueChange={setMaxRadius} min={50} max={2000} step={50} className="flex-1" />
      </div>

      {nearbySites.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No dark sites found within {maxRadius[0]} km. Try increasing the radius.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {nearbySites.map((site) => (
            <div
              key={site.name}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer group"
              onClick={() => onSelectSite(site)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{site.name}</p>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${bortleColor(site.bortle)}`}>
                    B{site.bortle}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>{site.country}</span>
                  {site.designation && (
                    <>
                      <span>·</span>
                      <span className="text-primary/80">{site.designation}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-xs font-medium text-foreground">{Math.round(site.distance)} km</p>
                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`, "_blank");
                    }}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Directions ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DarkSitesFinder;
