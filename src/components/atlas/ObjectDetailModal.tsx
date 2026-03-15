import { Helmet } from "react-helmet-async";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { calculateFov } from "@/lib/sky-images";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, MapPin, Eye, Ruler, Compass, HelpCircle, Camera, Clock, ExternalLink, Globe, Info, ChevronDown, ChevronUp, Telescope, Link as LinkIcon, Paperclip, Crosshair, Scale, Heart } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrentUser } from "@/hooks/useUserRigs";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AltitudeChart from "./AltitudeChart";
import ExposureGuideModal from "./ExposureGuideModal";
import AladinLiteViewer from "./AladinLiteViewer";
import NightPlanner from "./NightPlanner";
import SetupAssistant from "./SetupAssistant";
import { formatCatalogId } from "@/lib/format-catalog";

interface Props {
  obj: CelestialObject | null;
  open: boolean;
  onClose: () => void;
  onSelect?: (obj: CelestialObject) => void;
  lat: number;
  lng: number;
  focalLength?: number;
  sensorWidth?: number;
  sensorHeight?: number;
}

const ObjectDetailModal = ({ obj, open, onClose, onSelect, lat, lng, focalLength = 0, sensorWidth = 0, sensorHeight = 0 }: Props) => {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { openAuthModal } = useAuthModal();
  const [showExposureInfo, setShowExposureInfo] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [useDetailFallback, setUseDetailFallback] = useState(false);

  const { data: wikiImage, isLoading: imgLoading } = useObjectImage(
    obj?.catalog_id,
    obj?.common_name,
    obj?.ra,
    obj?.dec,
    obj?.size_max,
    obj?.image_search_query,
    obj?.forced_image_url,
    obj?.obj_type,
    1500
  );

  const hasWikiImage = !imgLoading && !imageFailed && wikiImage?.url && (wikiImage.source === "wikipedia" || wikiImage.source === "forced");

  // FOV for Aladin: size_max * 1.5 / 60, clamped between 0.05° and 5°
  const aladinFov = useMemo(() => {
    if (!obj?.size_max || obj.size_max <= 0) return 1.0;
    return Math.min(5.0, Math.max(0.05, (obj.size_max * 1.5) / 60));
  }, [obj?.size_max]);

  const [activeTab, setActiveTab] = useState("aladin");

  // Fetch parent object if this is a child
  const { data: parentObj } = useQuery({
    queryKey: ["celestial-parent", obj?.parent_id],
    queryFn: async () => {
      if (!obj?.parent_id) return null;
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("id, catalog_id, common_name, scientific_notation, obj_type")
        .eq("id", obj.parent_id)
        .single();
      return data as { id: string; catalog_id: string; common_name: string | null; scientific_notation: string | null; obj_type: string } | null;
    },
    enabled: !!obj?.parent_id,
    staleTime: Infinity,
  });

  // Fetch children if this object is a parent
  const { data: children } = useQuery({
    queryKey: ["celestial-children", obj?.id],
    queryFn: async () => {
      if (!obj?.id) return [];
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("id, catalog_id, common_name, scientific_notation, obj_type, relation_note")
        .eq("parent_id", obj.id)
        .order("catalog_id");
      return (data ?? []) as { id: string; catalog_id: string; common_name: string | null; scientific_notation: string | null; obj_type: string; relation_note: string | null }[];
    },
    enabled: !!obj?.id,
    staleTime: Infinity,
  });

  // Reset imageFailed when object changes
  useEffect(() => { setImageFailed(false); }, [obj?.catalog_id]);

  // Update default tab when image loading completes
  useEffect(() => {
    if (!imgLoading) {
      // Low photo_score objects default to Aladin for better context
      if ((obj?.photo_score ?? 0) <= 3 && obj?.ra != null) {
        setActiveTab("aladin");
      } else if (wikiImage?.url) {
        setActiveTab("photo");
      } else if (obj?.ra != null) {
        setActiveTab("aladin");
      }
    }
  }, [imgLoading, wikiImage?.url, obj?.ra, obj?.photo_score]);

  // Stellarium URL
  const stellariumUrl = useMemo(() => {
    if (!obj || obj.ra == null || obj.dec == null) return null;
    const id = obj.catalog_id.replace(/\s+/g, "");
    return `https://stellarium-web.org/skysource/${id}?ra=${obj.ra}&dec=${obj.dec}`;
  }, [obj]);

  // ESASky URL (new sky.esa.int)
  const esaSkyUrl = useMemo(() => {
    if (!obj || obj.ra == null || obj.dec == null) return null;
    const fov = calculateFov(obj.size_max);
    return `https://sky.esa.int/?target=${obj.ra}%20${obj.dec}&hips=DSS2%20color&fov=${fov}&reticle=true`;
  }, [obj]);


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
      {obj && (
        <Helmet>
          <title>{`${formatCatalogId(obj)}${obj.common_name ? ` — ${obj.common_name}` : ''} — Cosmic Frame Atlas`}</title>
          <meta name="description" content={`${obj.obj_type} in ${obj.constellation ?? 'the sky'}. ${obj.magnitude ? `Magnitude ${obj.magnitude}.` : ''} ${obj.size_max ? `Size ${obj.size_max} arcmin.` : ''} ${obj.photo_score ? `Photo score: ${obj.photo_score}/10.` : ''} Exposure guide and observation conditions on Cosmic Frame.`} />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": `${obj.common_name ?? obj.catalog_id} (${obj.catalog_id})`,
            "description": `${obj.obj_type} — ${obj.constellation ?? ''} — magnitude ${obj.magnitude ?? 'N/A'}`,
            "url": `https://cosmicframe.app/sky-atlas#${obj.catalog_id.replace(/\s+/g, '')}`
          })}</script>
        </Helmet>
      )}
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl bg-card border-border/50 text-foreground max-h-[90vh] overflow-y-auto">
          {/* Top section: Info left + Image right */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Title + Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{formatCatalogId(obj)}</h2>
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

            {/* Right: Media Gallery */}
            <div className="sm:w-64 shrink-0 space-y-1.5">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between gap-1">
                  <TabsList className="h-7 p-0.5 bg-muted/50 text-[10px]">
                    {hasWikiImage && (
                      <TabsTrigger value="photo" className="px-2 py-0.5 text-[10px] data-[state=active]:text-primary">
                        🖼️ Photo
                      </TabsTrigger>
                    )}
                    {obj.ra != null && obj.dec != null && (
                      <TabsTrigger value="aladin" className="px-2 py-0.5 text-[10px] data-[state=active]:text-primary">
                        🔭 Map
                      </TabsTrigger>
                    )}
                    {esaSkyUrl && (
                      <TabsTrigger value="esasky" className="px-2 py-0.5 text-[10px] data-[state=active]:text-primary">
                        🛰️ ESASky
                      </TabsTrigger>
                    )}
                  </TabsList>
                  {stellariumUrl && (
                    <a
                      href={stellariumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border text-[9px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shrink-0"
                      title="Open in Stellarium Web"
                    >
                      <Telescope className="w-3 h-3" />
                      <span className="hidden sm:inline">Stellarium</span>
                    </a>
                  )}
                </div>

                {/* Community Photo */}
                {hasWikiImage && (
                  <TabsContent value="photo" className="mt-1.5">
                    <div className="relative w-full rounded-lg overflow-hidden bg-muted/50 border border-border/30">
                      <a
                        href={wikiImage!.filePageUrl || wikiImage!.pageUrl || wikiImage!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                        title="Open on Wikimedia Commons"
                      >
                        <img
                          src={useDetailFallback && wikiImage!.fallbackUrl ? wikiImage!.fallbackUrl : wikiImage!.url}
                          alt={`${obj.catalog_id} ${obj.common_name ?? ""}`}
                          className="w-full max-h-64 object-contain hover:opacity-90 transition-opacity"
                          onError={() => {
                            if (!useDetailFallback && wikiImage?.fallbackUrl) {
                              setUseDetailFallback(true);
                            } else {
                              setImageFailed(true);
                              setActiveTab("aladin");
                            }
                          }}
                          loading="eager"
                        />
                      </a>
                      {wikiImage && (
                        <div className="border-t border-border/30">
                          {wikiImage.filePageUrl && (
                            <a
                              href={wikiImage.filePageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-[9px] text-primary hover:underline"
                            >
                              <Globe className="w-2.5 h-2.5 shrink-0" />
                              Wikimedia Commons
                            </a>
                          )}
                          <button
                            onClick={() => setShowCredits(!showCredits)}
                            className="w-full px-2 py-0.5 flex items-center justify-between text-[9px] text-muted-foreground hover:text-foreground transition-colors"
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Aladin Lite */}
                {obj.ra != null && obj.dec != null && (
                  <TabsContent value="aladin" className="mt-1.5">
                    <AladinLiteViewer ra={obj.ra} dec={obj.dec} fovDeg={aladinFov} />
                  </TabsContent>
                )}

                {/* ESASky */}
                {esaSkyUrl && (
                  <TabsContent value="esasky" className="mt-1.5">
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-border/30">
                      <iframe
                        src={esaSkyUrl}
                        className="w-full h-full border-0"
                        title={`ESASky view of ${obj.catalog_id}`}
                        allowFullScreen
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>

          {/* Parent link (if child) */}
          {obj.parent_id && parentObj && (
            <button
              onClick={() => onSelect?.({ ...parentObj, ra: null, dec: null, magnitude: null, surf_brightness: null, size_max: null, photo_score: null, exposure_guide_fast: null, exposure_guide_deep: null, best_months: null, recommended_filter: null, moon_tolerance: null, ideal_resolution: null, image_search_query: null, forced_image_url: null, constellation: null, parent_id: null, relation_note: null, search_aliases: null } as CelestialObject)}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left w-full"
            >
              <LinkIcon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Part of</p>
                <p className="text-sm font-semibold text-foreground">{formatCatalogId(parentObj)}</p>
                {parentObj.common_name && <p className="text-xs text-primary">{parentObj.common_name}</p>}
                {obj.relation_note && <p className="text-xs text-muted-foreground mt-1 italic">"{obj.relation_note}"</p>}
              </div>
            </button>
          )}

          {/* Children list (if parent) */}
          {children && children.length > 0 && (
            <div className="p-4 rounded-xl bg-secondary/30 space-y-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Related Objects</span>
                <Badge variant="secondary" className="text-[10px]">{children.length}</Badge>
              </div>
              <div className="space-y-1.5">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      // Navigate to child - we need full object data
                      onSelect?.({ ...child, ra: null, dec: null, magnitude: null, surf_brightness: null, size_max: null, photo_score: null, exposure_guide_fast: null, exposure_guide_deep: null, best_months: null, recommended_filter: null, moon_tolerance: null, ideal_resolution: null, image_search_query: null, forced_image_url: null, constellation: null, parent_id: obj.id, relation_note: child.relation_note, search_aliases: null } as CelestialObject);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 transition-colors"
                  >
                    <p className="text-xs font-semibold text-foreground">
                      {formatCatalogId(child)}
                      {child.common_name && <span className="text-primary font-normal ml-1.5">— {child.common_name}</span>}
                    </p>
                    {child.relation_note && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic">{child.relation_note}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <AltitudeChart ra={obj.ra} dec={obj.dec} lat={lat} lng={lng} />
          )}

          {/* FOV Calculator link — prominent */}
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate(`/fov-calculator?target=${encodeURIComponent(obj.catalog_id)}`)}
          >
            <Crosshair className="w-4 h-4" /> Frame this object in FOV Calculator
          </Button>

          {/* Rig Builder link */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate('/rig-builder')}
          >
            <Scale className="w-4 h-4" /> Compare equipment in Rig Builder
          </Button>
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
