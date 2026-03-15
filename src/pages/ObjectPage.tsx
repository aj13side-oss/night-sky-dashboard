import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { formatCatalogId } from "@/lib/format-catalog";
import { useTonightList } from "@/hooks/useTonightList";
import { useCurrentUser } from "@/hooks/useUserRigs";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import AltitudeChart from "@/components/atlas/AltitudeChart";
import AladinLiteViewer from "@/components/atlas/AladinLiteViewer";
import NightPlanner from "@/components/atlas/NightPlanner";
import SetupAssistant from "@/components/atlas/SetupAssistant";
import ExposureGuideModal from "@/components/atlas/ExposureGuideModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, Eye, Ruler, Compass, MapPin, Camera, Clock, HelpCircle,
  Crosshair, Scale, ArrowLeft, ClipboardList, Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

const ObjectPage = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const decodedId = decodeURIComponent(catalogId ?? "");
  const { userId } = useCurrentUser();
  const { isInList, addObject, removeObject } = useTonightList();
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  // Geolocation
  const [pos, setPos] = useState({ lat: 48.8566, lng: 2.3522 });
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  const { data: obj, isLoading } = useQuery({
    queryKey: ["object-page", decodedId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .eq("catalog_id", decodedId)
        .single();
      return data as CelestialObject | null;
    },
    enabled: !!decodedId,
    staleTime: Infinity,
  });

  const { data: wikiImage } = useObjectImage(
    obj?.catalog_id, obj?.common_name, obj?.ra, obj?.dec,
    obj?.size_max, obj?.image_search_query, obj?.forced_image_url, obj?.obj_type, 1500
  );

  const alt = obj?.ra != null && obj?.dec != null ? calculateAltitude(obj.ra, obj.dec, pos.lat, pos.lng) : null;
  const vis = alt != null ? getVisibilityLabel(alt) : null;
  const rs = useMemo(() => {
    if (!obj?.ra || !obj?.dec) return null;
    return getObjectRiseSetTransit(obj.ra, obj.dec, pos.lat, pos.lng, new Date());
  }, [obj?.ra, obj?.dec, pos.lat, pos.lng]);

  const aladinFov = useMemo(() => {
    if (!obj?.size_max || obj.size_max <= 0) return 1.0;
    return Math.min(5.0, Math.max(0.05, (obj.size_max * 1.5) / 60));
  }, [obj?.size_max]);

  const imageUrl = wikiImage?.url || null;

  const formatExposure = (minutes: number | null) => {
    if (minutes == null) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const handleTonightList = () => {
    if (!obj) return;
    if (isInList(obj.catalog_id)) {
      removeObject(obj.catalog_id);
      toast("Removed from tonight's list");
    } else {
      addObject(obj.catalog_id);
      toast.success("Added to tonight's list!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!obj) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Object not found</h1>
          <p className="text-muted-foreground mb-6">"{decodedId}" doesn't match any object in the catalog.</p>
          <Button onClick={() => navigate("/sky-atlas")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Atlas
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const inList = isInList(obj.catalog_id);

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title={`${obj.common_name ?? obj.catalog_id} — ${obj.obj_type}`}
        description={`${obj.obj_type} in ${obj.constellation ?? "the sky"}. ${obj.magnitude ? `Magnitude ${obj.magnitude.toFixed(1)}.` : ""} ${obj.photo_score ? `Photo score: ${obj.photo_score}/10.` : ""} Exposure guide, visibility, and equipment recommendations on Cosmic Frame.`}
        path={`/object/${encodeURIComponent(obj.catalog_id)}`}
        image={imageUrl || "/og-image.png"}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Thing",
          "name": obj.common_name ?? obj.catalog_id,
          "description": `${obj.obj_type} in ${obj.constellation ?? "the sky"}`,
          "url": `https://cosmicframe.app/object/${encodeURIComponent(obj.catalog_id)}`,
        }}
      />
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back + Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground mb-2" onClick={() => navigate("/sky-atlas")}>
              <ArrowLeft className="w-4 h-4" /> Back to Atlas
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{formatCatalogId(obj)}</h1>
            {obj.common_name && <p className="text-primary text-lg">{obj.common_name}</p>}
          </div>
          <div className="flex gap-2 mt-8">
            <Button variant="outline" size="sm" onClick={handleTonightList} className={`gap-1 ${inList ? "text-primary border-primary/30" : ""}`}>
              <ClipboardList className="w-4 h-4" />
              {inList ? "Listed" : "Tonight"}
            </Button>
          </div>
        </div>

        {/* Image + Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Media */}
          <div className="space-y-3">
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border/30 bg-muted/30">
                <img src={imageUrl} alt={obj.common_name ?? obj.catalog_id} className="w-full max-h-80 object-contain" />
              </div>
            )}
            {obj.ra != null && obj.dec != null && (
              <div className="rounded-xl overflow-hidden border border-border/30">
                <AladinLiteViewer ra={obj.ra} dec={obj.dec} fovDeg={aladinFov} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3">
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
              {obj.ra != null && <Badge variant="secondary" className="font-mono text-[10px]">RA {obj.ra.toFixed(4)}°</Badge>}
              {obj.dec != null && <Badge variant="secondary" className="font-mono text-[10px]">Dec {obj.dec.toFixed(4)}°</Badge>}
            </div>

            {/* Visibility */}
            {vis && alt != null && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold">{alt.toFixed(1)}°</span>
                <span className={`text-sm font-medium ${vis.color}`}>{vis.label}</span>
              </div>
            )}

            {/* Rise/Set */}
            {rs && !rs.neverRises && (
              <div className="text-xs text-muted-foreground font-mono p-3 rounded-xl bg-secondary/30">
                {rs.isCircumpolar ? "Up all night" : (
                  <>
                    {rs.riseTime && `↑ ${formatTimeShort(rs.riseTime)}`}
                    {rs.riseTime && rs.setTime && " · "}
                    {rs.setTime && `↓ ${formatTimeShort(rs.setTime)}`}
                    {rs.transitAlt > 0 && ` · Transit: ${rs.transitAlt.toFixed(0)}°`}
                  </>
                )}
              </div>
            )}

            {/* Exposure guide */}
            {((obj.exposure_guide_fast ?? 0) > 0 || (obj.exposure_guide_deep ?? 0) > 0) && (
              <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Capture Guide</span>
                  </div>
                  <button onClick={() => setShowExposureInfo(true)} className="text-muted-foreground hover:text-foreground"><HelpCircle className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(obj.exposure_guide_fast ?? 0) > 0 && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-1.5 text-xs text-accent font-medium mb-1"><Clock className="w-3 h-3" /> Fast</div>
                      <p className="text-lg font-bold font-mono text-foreground">{formatExposure(obj.exposure_guide_fast)}</p>
                    </div>
                  )}
                  {(obj.exposure_guide_deep ?? 0) > 0 && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1"><Clock className="w-3 h-3" /> Deep</div>
                      <p className="text-lg font-bold font-mono text-foreground">{formatExposure(obj.exposure_guide_deep)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Night Planner */}
        <NightPlanner targetRa={obj.ra} targetDec={obj.dec} />

        {/* Setup Assistant */}
        <SetupAssistant obj={obj} userFocalLength={0} />

        {/* Altitude Chart */}
        {obj.ra != null && obj.dec != null && (
          <AltitudeChart ra={obj.ra} dec={obj.dec} lat={pos.lat} lng={pos.lng} />
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate(`/fov-calculator?target=${encodeURIComponent(obj.catalog_id)}`)}>
            <Crosshair className="w-4 h-4" /> Frame in FOV Calculator
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/rig-builder")}>
            <Scale className="w-4 h-4" /> Compare in Rig Builder
          </Button>
        </div>
      </main>

      <Footer />
      <ExposureGuideModal open={showExposureInfo} onClose={() => setShowExposureInfo(false)} />
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon} {label}</div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default ObjectPage;
