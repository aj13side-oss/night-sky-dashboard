import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { getSkyImageUrl, getEsaSkyEmbedUrl } from "@/lib/sky-images";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Eye, Ruler, Compass, HelpCircle, Camera, Clock, ExternalLink, ImageIcon, Globe, Info, ChevronDown, ChevronUp } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"photo" | "esasky">("photo");
  const [showCredits, setShowCredits] = useState(false);

  const { data: wikiImage, isLoading: imgLoading } = useObjectImage(
    obj?.catalog_id,
    obj?.common_name,
    obj?.ra,
    obj?.dec,
    obj?.size_max,
    obj?.image_search_query
  );

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
          {/* Top section: Info left + Image right */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Title + Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{obj.catalog_id}</h2>
                {obj.common_name && (
                  <p className="text-primary text-sm">{obj.common_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Type" value={obj.obj_type} />
                <InfoItem icon={<Compass className="w-3.5 h-3.5" />} label="Constellation" value={obj.constellation ?? "—"} />
                <InfoItem icon={<Star className="w-3.5 h-3.5" />} label="Photo Score" value={obj.photo_score?.toString() ?? "—"} />
                <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Magnitude" value={obj.magnitude?.toFixed(1) ?? "—"} />
                <InfoItem icon={<Ruler className="w-3.5 h-3.5" />} label="Size" value={obj.size_max ? `${obj.size_max.toFixed(1)}'` : "—"} />
                <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Surf. Bright." value={obj.surf_brightness?.toFixed(1) ?? "—"} />
              </div>

              {/* Coordinates */}
              <div className="flex flex-wrap gap-1.5">
                {obj.ra != null && (
                  <Badge variant="secondary" className="font-mono text-[10px]">RA {obj.ra.toFixed(4)}°</Badge>
                )}
                {obj.dec != null && (
                  <Badge variant="secondary" className="font-mono text-[10px]">Dec {obj.dec.toFixed(4)}°</Badge>
                )}
              </div>

              {/* Current Visibility - compact in info column */}
              {vis && alt != null && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono font-semibold">{alt.toFixed(1)}°</span>
                  <span className={`font-medium ${vis.color}`}>{vis.label}</span>
                </div>
              )}
            </div>

            {/* Right: Image with toggle */}
            <div className="sm:w-64 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex rounded-md border border-border overflow-hidden text-[10px]">
                  <button
                    onClick={() => setViewMode("photo")}
                    className={`px-2 py-0.5 transition-colors ${viewMode === "photo" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}
                  >
                    🖼️ Photo
                  </button>
                  <button
                    onClick={() => setViewMode("esasky")}
                    className={`px-2 py-0.5 transition-colors border-l border-border ${viewMode === "esasky" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}
                  >
                    🔭 ESASky
                  </button>
                </div>
                {viewMode === "photo" && wikiImage?.pageUrl && (
                  <a href={wikiImage.pageUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {viewMode === "esasky" && obj.ra != null && obj.dec != null && (
                  <a href={getEsaSkyEmbedUrl(obj.catalog_id, obj.size_max)} target="_blank" rel="noopener noreferrer" className="text-[9px] text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="relative w-full rounded-xl overflow-hidden bg-muted/50 border border-border/30">
                {viewMode === "photo" ? (
                  <>
                    {imgLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="h-5 w-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : wikiImage?.url ? (
                      <img
                        src={wikiImage.url}
                        alt={`${obj.catalog_id} ${obj.common_name ?? ""}`}
                        className="w-full h-auto"
                        loading="eager"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-40 text-[10px] text-muted-foreground">
                        No image available
                      </div>
                    )}
                    {wikiImage && !imgLoading && (
                      <div className="border-t border-border/30">
                        <button
                          onClick={() => setShowCredits(!showCredits)}
                          className="w-full px-2 py-1 flex items-center justify-between text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="flex items-center gap-1 truncate">
                            <Info className="w-2.5 h-2.5 shrink-0" />
                            {wikiImage.artist ?? "Credits"}
                          </span>
                          {showCredits ? <ChevronUp className="w-2.5 h-2.5 shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 shrink-0" />}
                        </button>
                        {showCredits && (
                          <div className="px-2 pb-1.5 space-y-0.5 text-[9px] text-muted-foreground">
                            {wikiImage.artist && (
                              <div><span className="text-foreground/70 font-medium">Author:</span> {wikiImage.artist}</div>
                            )}
                            {wikiImage.date && (
                              <div><span className="text-foreground/70 font-medium">Date:</span> {wikiImage.date}</div>
                            )}
                            {wikiImage.license && (
                              <div>
                                <span className="text-foreground/70 font-medium">License:</span>{" "}
                                {wikiImage.licenseUrl ? (
                                  <a href={wikiImage.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{wikiImage.license}</a>
                                ) : wikiImage.license}
                              </div>
                            )}
                            {wikiImage.filePageUrl && (
                              <a href={wikiImage.filePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <Globe className="w-2.5 h-2.5" /> Source
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-48">
                    {obj.ra != null && obj.dec != null ? (
                      <img
                        key={obj.catalog_id}
                        src={getSkyImageUrl(obj.ra, obj.dec, obj.size_max, 400, 300) ?? ""}
                        alt={`${obj.catalog_id} sky survey`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                        No coordinates
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Capture Guide - full width below */}
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
