import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { getSkyImageUrl, getEsaSkyEmbedUrl } from "@/lib/sky-images";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Eye, Ruler, Compass, HelpCircle, Camera, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import AltitudeChart from "./AltitudeChart";
import ExposureGuideModal from "./ExposureGuideModal";
import FovOverlay from "./FovOverlay";
import NightPlanner from "./NightPlanner";
import SetupAssistant from "./SetupAssistant";

interface Props {
  obj: CelestialObject | null;
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  focalLength?: number;
  sensorWidth?: number;
  sensorHeight?: number;
}

const ObjectDetailModal = ({ obj, open, onClose, lat, lng, focalLength = 0, sensorWidth = 0, sensorHeight = 0 }: Props) => {
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  if (!obj) return null;

  const alt =
    obj.ra != null && obj.dec != null
      ? calculateAltitude(obj.ra, obj.dec, lat, lng)
      : null;
  const vis = alt != null ? getVisibilityLabel(alt) : null;

  const formatExposure = (minutes: number | null) => {
    if (minutes == null) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl bg-card border-border/50 text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {obj.catalog_id}
              {obj.common_name && (
                <span className="text-primary ml-2 text-base font-normal">{obj.common_name}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Sky Survey Image */}
          {obj.ra != null && obj.dec != null && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-muted/50 border border-border/30 group">
              <img
                src={getSkyImageUrl(obj.ra, obj.dec, obj.size_max, 600, 300) ?? ""}
                alt={`${obj.catalog_id} sky survey`}
                className="w-full h-full object-cover"
              />
              <a
                href={getEsaSkyEmbedUrl(obj.catalog_id, obj.size_max)}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-3 h-3" /> Ouvrir dans ESASky
              </a>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoItem icon={<Eye className="w-4 h-4" />} label="Type" value={obj.obj_type} />
            <InfoItem icon={<Compass className="w-4 h-4" />} label="Constellation" value={obj.constellation ?? "—"} />
            <InfoItem icon={<Star className="w-4 h-4" />} label="Photo Score" value={obj.photo_score?.toString() ?? "—"} />
            <InfoItem icon={<Eye className="w-4 h-4" />} label="Magnitude" value={obj.magnitude?.toFixed(1) ?? "—"} />
            <InfoItem icon={<Ruler className="w-4 h-4" />} label="Size" value={obj.size_max ? `${obj.size_max.toFixed(1)}'` : "—"} />
            <InfoItem icon={<Eye className="w-4 h-4" />} label="Surf. Brightness" value={obj.surf_brightness?.toFixed(1) ?? "—"} />
          </div>

          {/* Coordinates */}
          <div className="flex flex-wrap gap-2 text-xs">
            {obj.ra != null && (
              <Badge variant="secondary" className="font-mono">RA {obj.ra.toFixed(4)}°</Badge>
            )}
            {obj.dec != null && (
              <Badge variant="secondary" className="font-mono">Dec {obj.dec.toFixed(4)}°</Badge>
            )}
          </div>

          {/* Capture Guide */}
          {((obj.exposure_guide_fast ?? 0) > 0 || (obj.exposure_guide_deep ?? 0) > 0) && (
            <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Capture Guide</span>
                </div>
                <button
                  onClick={() => setShowExposureInfo(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(obj.exposure_guide_fast ?? 0) > 0 && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-1.5 text-xs text-accent font-medium mb-1">
                      <Clock className="w-3 h-3" /> Fast Capture
                    </div>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {formatExposure(obj.exposure_guide_fast)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Quick Look</p>
                  </div>
                )}
                {(obj.exposure_guide_deep ?? 0) > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
                      <Clock className="w-3 h-3" /> Deep Imaging
                    </div>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {formatExposure(obj.exposure_guide_deep)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">High Quality</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Bortle 1 estimate · Tap <HelpCircle className="w-3 h-3 inline" /> for details
              </p>
            </div>
          )}

          {/* Night Planner */}
          <NightPlanner targetRa={obj.ra} targetDec={obj.dec} />

          {/* Setup Assistant */}
          <SetupAssistant obj={obj} userFocalLength={focalLength} />

          {/* Current Visibility */}
          {vis && alt != null && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Current altitude:</span>
              <span className="font-mono text-sm font-semibold">{alt.toFixed(1)}°</span>
              <span className={`text-sm font-medium ${vis.color}`}>{vis.label}</span>
            </div>
          )}

          {/* Altitude Chart */}
          {obj.ra != null && obj.dec != null && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Altitude over 24h
              </h4>
              <AltitudeChart ra={obj.ra} dec={obj.dec} lat={lat} lng={lng} />
            </div>
          )}

          {/* FOV Simulator */}
          {obj.size_max != null && obj.size_max > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sensor Framing
              </h4>
              <FovOverlay
                objectSizeArcmin={obj.size_max}
                focalLength={focalLength}
                sensorWidth={sensorWidth}
                sensorHeight={sensorHeight}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExposureGuideModal open={showExposureInfo} onClose={() => setShowExposureInfo(false)} />
    </>
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
