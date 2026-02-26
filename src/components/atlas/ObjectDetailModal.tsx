import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Eye, Ruler, Compass } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  obj: CelestialObject | null;
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
}

const ObjectDetailModal = ({ obj, open, onClose, lat, lng }: Props) => {
  const aladinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !obj || obj.ra == null || obj.dec == null) return;

    const loadAladin = async () => {
      const container = aladinRef.current;
      if (!container) return;

      if (!(window as any).A) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css";
        document.head.appendChild(link);

        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const A = (window as any).A;
      if (A) {
        container.innerHTML = "";
        A.init.then(() => {
          A.aladin(container, {
            target: `${obj.ra} ${obj.dec}`,
            fov: Math.min((obj.size_max ?? 30) / 60 * 3, 2),
            survey: "P/DSS2/color",
            showReticle: true,
            showZoomControl: true,
            showLayersControl: false,
            showGotoControl: false,
            showFrame: false,
          });
        });
      }
    };

    const timeout = setTimeout(loadAladin, 100);
    return () => clearTimeout(timeout);
  }, [open, obj]);

  if (!obj) return null;

  const alt =
    obj.ra != null && obj.dec != null
      ? calculateAltitude(obj.ra, obj.dec, lat, lng)
      : null;
  const vis = alt != null ? getVisibilityLabel(alt) : null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {obj.catalog_id}
            {obj.common_name && (
              <span className="text-primary ml-2 text-base font-normal">{obj.common_name}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={aladinRef}
          className="w-full h-64 rounded-xl overflow-hidden bg-muted/50 border border-border/30"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          <InfoItem icon={<Eye className="w-4 h-4" />} label="Type" value={obj.obj_type} />
          <InfoItem icon={<Compass className="w-4 h-4" />} label="Constellation" value={obj.constellation ?? "—"} />
          <InfoItem icon={<Star className="w-4 h-4" />} label="Photo Score" value={obj.photo_score?.toString() ?? "—"} />
          <InfoItem icon={<Eye className="w-4 h-4" />} label="Magnitude" value={obj.magnitude?.toFixed(1) ?? "—"} />
          <InfoItem icon={<Ruler className="w-4 h-4" />} label="Size" value={obj.size_max ? `${obj.size_max.toFixed(1)}'` : "—"} />
          <InfoItem icon={<Eye className="w-4 h-4" />} label="Surf. Brightness" value={obj.surf_brightness?.toFixed(1) ?? "—"} />
        </div>

        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          {obj.ra != null && (
            <Badge variant="secondary" className="font-mono">RA {obj.ra.toFixed(4)}°</Badge>
          )}
          {obj.dec != null && (
            <Badge variant="secondary" className="font-mono">Dec {obj.dec.toFixed(4)}°</Badge>
          )}
        </div>

        {vis && alt != null && (
          <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-secondary/30">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current altitude:</span>
            <span className="font-mono text-sm font-semibold">{alt.toFixed(1)}°</span>
            <span className={`text-sm font-medium ${vis.color}`}>{vis.label}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      {icon} {label}
    </div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default ObjectDetailModal;
