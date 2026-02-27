import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BORTLE_MULTIPLIERS } from "@/lib/dark-sites";

interface Props {
  lat: number;
  lng: number;
  bortle: number;
  onClose: () => void;
}

const BORTLE_META: Record<number, { label: string; color: string }> = {
  1: { label: "Excellent dark site", color: "#000000" },
  2: { label: "Typical dark site", color: "#1a1a2e" },
  3: { label: "Rural sky", color: "#16213e" },
  4: { label: "Rural/suburban transition", color: "#0f3460" },
  5: { label: "Suburban sky", color: "#533483" },
  6: { label: "Bright suburban", color: "#e94560" },
  7: { label: "Suburban/urban transition", color: "#ff6b35" },
  8: { label: "City sky", color: "#ff9f1c" },
  9: { label: "Inner-city sky", color: "#ffffff" },
};

const BortleInfoPanel = ({ lat, lng, bortle, onClose }: Props) => {
  const meta = BORTLE_META[bortle];
  const impact = BORTLE_MULTIPLIERS[bortle];

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Clicked Location</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: meta.color }} />
        <div>
          <p className="text-lg font-bold text-foreground">Bortle {bortle}</p>
          <p className="text-xs text-muted-foreground">{meta.label}</p>
        </div>
      </div>

      <div className="font-mono text-xs text-muted-foreground">
        {lat.toFixed(4)}°, {lng.toFixed(4)}°
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">Exposure multiplier</p>
          <p className="font-mono text-sm font-bold text-foreground">×{impact.multiplier}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">Limiting magnitude</p>
          <p className="font-mono text-sm font-bold text-foreground">{impact.limitingMag} mag</p>
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
