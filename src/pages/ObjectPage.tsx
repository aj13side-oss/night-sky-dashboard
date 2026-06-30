import { useParams, useNavigate, Link } from "react-router-dom";
import { useLocalizedPath, useLocalizedNavigate, useIsFrench } from "@/lib/localized-nav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { calculateAltitude, getVisibilityLabel } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { formatCatalogId } from "@/lib/format-catalog";
import { formatRA, formatDec } from "@/lib/format-coords";
import { useTonightList } from "@/hooks/useTonightList";
import { useObservation } from "@/contexts/ObservationContext";
import { getDisplaySeason } from "@/lib/dynamic-score";
import { getRarityColor } from "@/lib/rarity";
import { useLabelMaps } from "@/hooks/useLabelMaps";
import { resolvePlaceholders } from "@/lib/resolve-placeholders";
import { formatExposure } from "@/lib/format-exposure";

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
  Crosshair, Scale, ArrowLeft, ClipboardList, Loader2, Telescope, MessageCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";


const ObjectPage = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useLocalizedNavigate();
  const lp = useLocalizedPath();
  const decodedId = decodeURIComponent(catalogId ?? "");
  
  const { isInList, addObject, removeObject } = useTonightList();
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  const { location: pos } = useObservation();


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
    obj?.catalog_id, obj?.common_name, obj?.ra_deg, obj?.dec_deg,
    obj?.size_max, obj?.image_search_query, obj?.forced_image_url, obj?.obj_type, 1500
  );

  const alt = obj?.ra_deg != null && obj?.dec_deg != null ? calculateAltitude(obj.ra_deg, obj.dec_deg, pos.lat, pos.lng) : null;
  const vis = alt != null ? getVisibilityLabel(alt) : null;
  const rs = useMemo(() => {
    if (!obj?.ra_deg || !obj?.dec_deg) return null;
    return getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, pos.lat, pos.lng, new Date());
  }, [obj?.ra_deg, obj?.dec_deg, pos.lat, pos.lng]);

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
        title={`${obj.common_name ? `${obj.common_name} (${obj.catalog_id})` : obj.catalog_id} Astrophotography${obj.obj_type ? ` — ${obj.obj_type}` : ''}`}
        description={(() => {
          const name = obj.common_name ?? obj.catalog_id;
          const type = obj.obj_type ?? "deep sky object";
          const mag = obj.magnitude != null ? `, mag ${obj.magnitude.toFixed(1)}` : "";
          const constellation = obj.constellation ? ` in ${obj.constellation}` : "";
          const desc = `Photograph ${name} (${obj.catalog_id}): ${type}${constellation}${mag}. Exposure guide & framing on Cosmic Frame.`;
          return desc.length > 155 ? desc.slice(0, 152).trimEnd() + "…" : desc;
        })()}
        canonical={`https://cosmicframe.app/object/${encodeURIComponent(obj.catalog_id)}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `${obj.common_name ?? obj.catalog_id} Astrophotography Guide`,
            "description": `${obj.obj_type ?? 'Deep sky object'} in ${obj.constellation ?? 'the sky'}, magnitude ${obj.magnitude?.toFixed(1) ?? 'unknown'}.`,
            "url": `https://cosmicframe.app/object/${encodeURIComponent(obj.catalog_id)}`,
            "publisher": {
              "@type": "Organization",
              "name": "Cosmic Frame",
              "url": "https://cosmicframe.app"
            },
            ...(imageUrl ? { "image": imageUrl } : {})
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://cosmicframe.app/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Sky Atlas",
                "item": "https://cosmicframe.app/sky-atlas"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": obj.common_name ?? obj.catalog_id,
                "item": `https://cosmicframe.app/object/${encodeURIComponent(obj.catalog_id)}`
              }
            ]
          }
        ]}
      />
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to={lp("/")} className="hover:text-foreground transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link to={lp("/sky-atlas")} className="hover:text-foreground transition-colors">Sky Atlas</Link>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium" aria-current="page">
              {obj.common_name ?? obj.catalog_id}
            </li>
          </ol>
        </nav>

        {/* Back + Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground mb-2" onClick={() => navigate("/sky-atlas")}>
              <ArrowLeft className="w-4 h-4" /> Back to Atlas
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{formatCatalogId(obj)}</h1>
            {obj.common_name && <p className="text-primary text-lg">{obj.common_name}</p>}
            {obj.rarity && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow"
                  style={{ backgroundColor: getRarityColor(obj.rarity), color: "#0F172A" }}
                >
                  {obj.rarity}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-8">
            <Button variant="outline" size="sm" onClick={handleTonightList} className={`gap-1 ${inList ? "text-primary border-primary/30" : ""}`}>
              <ClipboardList className="w-4 h-4" />
              {inList ? "Listed" : "Tonight"}
            </Button>
          </div>
        </div>

        {(obj as any).description && (
          <p className="text-muted-foreground leading-relaxed">
            {(obj as any).description}
          </p>
        )}

        {/* SEO text block — indexable content for search engines */}
        <h2 className="text-xl font-semibold text-foreground pt-2">
          How to photograph {obj.common_name ?? obj.catalog_id}
        </h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-1 max-w-2xl">
          <p>
            {obj.common_name ? `The ${obj.common_name} (${obj.catalog_id})` : obj.catalog_id} is
            a{/^[aeiou]/i.test(obj.obj_type ?? '') ? 'n' : ''} {obj.obj_type?.toLowerCase() ?? 'deep sky object'}
            {obj.constellation ? ` in the constellation ${obj.constellation}` : ''}.
            {obj.magnitude != null ? ` Visual magnitude: ${obj.magnitude.toFixed(1)}.` : ''}
            {obj.size_max != null && obj.size_max > 0 ? ` Angular size: ${obj.size_max.toFixed(0)}′.` : ''}
          </p>
          {(obj.best_months || obj.recommended_filter) && (() => {
            const season = getDisplaySeason(obj.best_months, obj.dec_deg, pos.lat);
            const seasonSentence = season.isCircumpolar
              ? `Visible year-round from your location.`
              : season.isInvisible
              ? `Not visible from your location.`
              : season.label
              ? `Best season for astrophotography: ${season.label}.`
              : '';
            return (
              <p>
                {seasonSentence}
                {obj.recommended_filter ? ` Recommended filter: ${obj.recommended_filter}.` : ''}
                {obj.ideal_resolution ? ` Ideal sampling: ${obj.ideal_resolution}.` : ''}
              </p>
            );
          })()}
          {(obj.exposure_guide_fast || obj.exposure_guide_deep) && (
            <p>
              Suggested total integration time:
              {obj.exposure_guide_fast ? ` ${formatExposure(obj.exposure_guide_fast)} for a quick session` : ''}
              {obj.exposure_guide_fast && obj.exposure_guide_deep ? ',' : ''}
              {obj.exposure_guide_deep ? ` ${formatExposure(obj.exposure_guide_deep)} for a deep image` : ''}.
            </p>
          )}
          <p>
            Match your <Link to={lp("/equipment")} className="text-primary hover:underline">astrophotography equipment</Link> to this target,
            then check focal length and sampling in the{' '}
            <Link to={lp(`/fov-calculator?target=${encodeURIComponent(obj.catalog_id)}`)} className="text-primary hover:underline">
              field of view &amp; arcsec/pixel calculator
            </Link>.
          </p>
        </div>

        {obj.seo_description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {obj.seo_description}
          </p>
        )}

        {/* Image + Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Media */}
          <div className="space-y-3">
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border/30 bg-muted/30">
                <img src={imageUrl} alt={obj.common_name ?? obj.catalog_id} width={800} height={320} fetchPriority="high" decoding="async" className="w-full max-h-80 object-contain" />
              </div>
            )}
            {obj.ra_deg != null && obj.dec_deg != null && (
              <div className="rounded-xl overflow-hidden border border-border/30">
                <AladinLiteViewer ra={obj.ra_deg} dec={obj.dec_deg} fovDeg={aladinFov} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Type" value={obj.obj_type} />
              <InfoItem icon={<Compass className="w-3.5 h-3.5" />} label="Constellation" value={obj.constellation ?? "—"} />
              <InfoItem icon={<Star className="w-3.5 h-3.5" />} label="Accessibility Score" value={obj.photo_score?.toString() ?? "—"} />
              <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Magnitude" value={obj.magnitude?.toFixed(1) ?? "—"} />
              <InfoItem icon={<Ruler className="w-3.5 h-3.5" />} label="Size" value={obj.size_max ? `${obj.size_max.toFixed(1)}'` : "—"} />
              <InfoItem icon={<Eye className="w-3.5 h-3.5" />} label="Surf. Bright." value={obj.surf_brightness?.toFixed(1) ?? "—"} />
            </div>

            {/* Coordinates */}
            <div className="flex flex-wrap gap-1.5">
              {obj.ra_hours != null && <Badge variant="secondary" className="font-mono text-[10px]">RA {formatRA(obj.ra_hours)}</Badge>}
              {obj.dec_deg != null && <Badge variant="secondary" className="font-mono text-[10px]">Dec {formatDec(obj.dec_deg)}</Badge>}
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
                <h3 className="sr-only">{obj.common_name ?? obj.catalog_id} exposure settings</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Recommended exposure &amp; settings</span>
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
        <NightPlanner targetRa={obj.ra_deg} targetDec={obj.dec_deg} />

        {/* Setup Assistant */}
        <h2 className="text-xl font-semibold text-foreground pt-2">
          Best equipment for {obj.common_name ?? obj.catalog_id}
        </h2>
        <SetupAssistant obj={obj} userFocalLength={0} />

        {/* Equipment Recommendations — internal links into catalog */}
        <EquipmentRecommendations obj={obj} />

        {/* Altitude Chart */}
        {obj.ra_deg != null && obj.dec_deg != null && (
          <AltitudeChart ra={obj.ra_deg} dec={obj.dec_deg} lat={pos.lat} lng={pos.lng} />
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate(`/fov-calculator?target=${encodeURIComponent(obj.catalog_id)}`)}>
            <Crosshair className="w-4 h-4" /> Frame in FOV Calculator
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/equipment")}>
            <Scale className="w-4 h-4" /> Compare in Rig Builder
          </Button>
        </div>

        {/* Community gallery teaser */}
        <div className="rounded-xl border border-border/30 bg-secondary/20 p-5 block space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">See what others capture</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Browse real images of this target from astrophotographers using gear like yours. Coming soon.
          </p>
          <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
        </div>

        {/* Similar Objects */}
        <SimilarObjects obj={obj} />

        {/* Community contributions teaser */}
        <div className="rounded-xl border border-border/30 bg-secondary/20 p-5 block space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Community contributions</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Share your shots, tips and notes on this target. Coming soon.
          </p>
          <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
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

const EquipmentRecommendations = ({ obj }: { obj: CelestialObject }) => {
  const lp = useLocalizedPath();
  const name = obj.common_name ?? obj.catalog_id;
  const size = obj.size_max ?? 0;
  const filter = obj.recommended_filter?.toLowerCase() ?? "";

  let scopeLink = "/equipment?category=telescopes";
  let scopeLabel = "Standard refractor or small Newtonian";
  let scopeDesc = `${name} sits in the mid-range angular size — a 400–800mm focal length refractor or small Newtonian frames it nicely.`;

  if (size > 60) {
    scopeLink = "/equipment?category=telescopes&fov=wide";
    scopeLabel = "Wide-field short focal length refractor";
    scopeDesc = `${name} spans a large area of sky (${size.toFixed(0)}′). A short focal length refractor (200–500mm) is required to fit it in the frame.`;
  } else if (size > 0 && size < 10) {
    scopeLink = "/equipment?category=telescopes&fov=long";
    scopeLabel = "Long focal length SCT or large Newtonian";
    scopeDesc = `${name} is small (${size.toFixed(1)}′). A long focal length scope (1200mm+) like an SCT or large Newtonian reveals its details.`;
  }

  const isNarrowband = /ha|h-?alpha|oiii|sii|narrow|dual/.test(filter);
  const isBroadband = /uhc|cls|l-?pro|lps|broadband|light pollution/.test(filter);
  let filterLink = "/equipment?category=filters";
  let filterLabel = obj.recommended_filter ?? "Light pollution filter";
  let filterDesc = obj.recommended_filter
    ? `For ${name}, the recommended filter is ${obj.recommended_filter}. Browse compatible options in the catalog.`
    : `A light pollution filter improves contrast on ${name} from suburban skies.`;
  if (isNarrowband) {
    filterDesc = `${name} responds well to narrowband filters (${obj.recommended_filter}) — they isolate emission lines and cut through moonlight.`;
  } else if (isBroadband) {
    filterDesc = `${name} benefits from a broadband light-pollution filter (${obj.recommended_filter}) to boost contrast under city skies.`;
  }

  const recs: { href: string; label: string; desc: string }[] = [
    { href: scopeLink, label: scopeLabel, desc: scopeDesc },
    {
      href: "/equipment?category=cameras",
      label: "Cooled dedicated astro camera",
      desc: `For long exposures on ${name}, a cooled astrophotography camera (mono or one-shot color) keeps thermal noise low.`,
    },
    {
      href: "/equipment?category=mounts",
      label: "Tracking equatorial mount",
      desc: `${name} requires accurate tracking — an equatorial mount sized for your scope's weight is essential.`,
    },
    { href: filterLink, label: filterLabel, desc: filterDesc },
  ];

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-xl font-semibold text-foreground">
        Recommended gear for {name}
      </h2>
      <ul className="space-y-2">
        {recs.map((r, i) => (
          <li key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
            <Link to={lp(r.href)} className="text-primary hover:underline font-medium text-sm">
              {r.label} →
            </Link>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

const SimilarObjects = ({ obj }: { obj: CelestialObject }) => {
  const lp = useLocalizedPath();
  const { data: similar } = useQuery({
    queryKey: ["similar-objects", obj.id, obj.obj_type, obj.constellation],
    queryFn: async () => {
      let { data } = await (supabase as any)
        .from("celestial_objects")
        .select("id, catalog_id, common_name, obj_type, constellation, photo_score, forced_image_url, magnitude, rarity")
        .eq("obj_type", obj.obj_type)
        .eq("constellation", obj.constellation)
        .neq("id", obj.id)
        .order("photo_score", { ascending: false })
        .limit(6);
      if (!data || data.length < 4) {
        const { data: broader } = await (supabase as any)
          .from("celestial_objects")
          .select("id, catalog_id, common_name, obj_type, constellation, photo_score, forced_image_url, magnitude, rarity")
          .eq("obj_type", obj.obj_type)
          .neq("id", obj.id)
          .order("photo_score", { ascending: false })
          .limit(6);
        data = broader;
      }
      return data ?? [];
    },
    enabled: !!obj,
    staleTime: Infinity,
  });

  if (!similar || similar.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Telescope className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Similar Objects</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {similar.map((s: any) => (
          <Link
            key={s.id}
            to={lp(`/object/${encodeURIComponent(s.catalog_id)}`)}
            className="glass-card rounded-xl p-3 hover:bg-secondary/50 transition-colors space-y-2"
          >
            {s.forced_image_url && (
              <img src={s.forced_image_url} alt={s.catalog_id} loading="lazy" decoding="async" width={200} height={80} className="w-full h-20 object-cover rounded-lg bg-black" />
            )}
            <div>
              <p className="text-xs font-semibold text-foreground truncate">{s.catalog_id}</p>
              {s.common_name && <p className="text-[10px] text-primary truncate">{s.common_name}</p>}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {s.rarity && (
                  <Badge
                    className="text-[9px] px-1 py-0 border-0"
                    style={{ backgroundColor: getRarityColor(s.rarity), color: "#0F172A" }}
                  >
                    {s.rarity}
                  </Badge>
                )}
                {s.photo_score && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">⭐ {s.photo_score}</Badge>
                )}
                {s.magnitude && (
                  <span className="text-[9px] text-muted-foreground">mag {s.magnitude.toFixed(1)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ObjectPage;
