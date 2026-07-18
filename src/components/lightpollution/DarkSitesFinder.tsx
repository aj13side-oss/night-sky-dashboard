import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Star, ExternalLink } from "lucide-react";
import type { DbDarkSite } from "@/hooks/useDarkSites";
import { bortleChipClass } from "@/lib/bortle-colors";

export interface DarkSiteWithDistance extends DbDarkSite {
  distance: number;
}

interface Props {
  sites: DarkSiteWithDistance[];
  isLoading: boolean;
  radius: number;
  onRadiusChange: (n: number) => void;
  onSelectSite: (site: DarkSiteWithDistance) => void;
}

const DarkSitesFinder = ({ sites, isLoading, radius, onRadiusChange, onSelectSite }: Props) => {
  const { t, i18n } = useTranslation("lightpollution");
  const isFr = i18n.language?.toLowerCase().startsWith("fr");

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t("darkSites.title")}</h3>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          {t("darkSites.radius", { n: radius })}
        </Label>
        <Slider
          value={[radius]}
          onValueChange={(v) => onRadiusChange(v[0])}
          min={50}
          max={500}
          step={50}
          className="flex-1"
        />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t("darkSites.loading")}</p>
      ) : sites.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t("darkSites.empty", { n: radius })}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sites.map((site) => {
            const desc = isFr
              ? site.description_fr || site.description_en
              : site.description_en || site.description_fr;
            return (
              <div
                key={site.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer group"
                onClick={() => onSelectSite(site)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{site.name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${bortleChipClass(site.bortle)}`}
                    >
                      B{site.bortle}
                    </Badge>
                    {site.is_official_rice && (
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 border-primary/50 text-primary bg-primary/10"
                      >
                        {t("darkSites.rice")}
                      </Badge>
                    )}
                  </div>
                  {site.region && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{site.region}</p>
                  )}
                  {desc && (
                    <p className="text-xs text-muted-foreground/90 mt-1 leading-snug line-clamp-2">
                      {desc}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="font-mono text-xs font-medium text-foreground">
                    {Math.round(site.distance)} km
                  </p>
                  <div className="flex gap-2 items-center">
                    {site.website && (
                      <a
                        href={site.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title={t("darkSites.website")}
                        aria-label={t("darkSites.website")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`,
                          "_blank"
                        );
                      }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {t("darkSites.directions")} ↗
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DarkSitesFinder;
