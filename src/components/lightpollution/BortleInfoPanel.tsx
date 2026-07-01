import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { BORTLE_MULTIPLIERS } from "@/lib/dark-sites";

interface Props {
  lat: number;
  lng: number;
  bortle: number;
  onClose: () => void;
}

const BORTLE_COLORS: Record<number, string> = {
  1: "#000000",
  2: "#1a1a2e",
  3: "#16213e",
  4: "#0f3460",
  5: "#533483",
  6: "#e94560",
  7: "#ff6b35",
  8: "#ff9f1c",
  9: "#ffffff",
};

const BortleInfoPanel = ({ lat, lng, bortle, onClose }: Props) => {
  const { t } = useTranslation("lightpollution");
  const color = BORTLE_COLORS[bortle];
  const label = t(`bortle.labels.${bortle}`);
  const impact = BORTLE_MULTIPLIERS[bortle];

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t("infoPanel.clickedLocation")}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: color }} />
        <div>
          <p className="text-lg font-bold text-foreground">{t("bortle.prefix")} {bortle}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>

      <div className="font-mono text-xs text-muted-foreground">
        {lat.toFixed(4)}°, {lng.toFixed(4)}°
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">{t("infoPanel.exposureMultiplier")}</p>
          <p className="font-mono text-sm font-bold text-foreground">×{impact.multiplier}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">{t("infoPanel.limitingMagnitude")}</p>
          <p className="font-mono text-sm font-bold text-foreground">{impact.limitingMag} {t("infoPanel.mag")}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank")}
        >
          <Navigation className="w-3 h-3" /> Google Maps
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank")}
        >
          <Navigation className="w-3 h-3" /> Waze
        </Button>
      </div>
    </div>
  );
};

export default BortleInfoPanel;
