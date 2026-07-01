import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Locate, Maximize2, Minimize2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BortleInfoPanel from "@/components/lightpollution/BortleInfoPanel";
import DarkSitesFinder from "@/components/lightpollution/DarkSitesFinder";
import CitySearch from "@/components/lightpollution/CitySearch";
import ImagingImpactCard from "@/components/lightpollution/ImagingImpactCard";
import { DarkSite } from "@/lib/dark-sites";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const BORTLE_SCALE = [
  { level: 1, label: "Excellent dark site", color: "#000000", sqm: "21.99–22.00" },
  { level: 2, label: "Typical dark site", color: "#1a1a2e", sqm: "21.89–21.99" },
  { level: 3, label: "Rural sky", color: "#16213e", sqm: "21.69–21.89" },
  { level: 4, label: "Rural/suburban transition", color: "#0f3460", sqm: "20.49–21.69" },
  { level: 5, label: "Suburban sky", color: "#533483", sqm: "19.50–20.49" },
  { level: 6, label: "Bright suburban", color: "#e94560", sqm: "18.94–19.50" },
  { level: 7, label: "Suburban/urban transition", color: "#ff6b35", sqm: "18.38–18.94" },
  { level: 8, label: "City sky", color: "#ff9f1c", sqm: "17.80–18.38" },
  { level: 9, label: "Inner-city sky", color: "#ffffff", sqm: "< 17.80" },
];

/** Estimate Bortle level from the light pollution tile color at click point */
function estimateBortleFromClick(map: L.Map, latlng: L.LatLng): number {
  try {
    const container = map.getContainer();
    const point = map.latLngToContainerPoint(latlng);
    // Find tile layer canvas/images
    const tiles = container.querySelectorAll<HTMLImageElement>(".leaflet-tile-pane img");
    // Create an offscreen canvas to sample pixel
    for (const tile of Array.from(tiles)) {
      const rect = tile.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const px = point.x - (rect.left - containerRect.left);
      const py = point.y - (rect.top - containerRect.top);
      if (px >= 0 && py >= 0 && px < rect.width && py < rect.height) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = tile.naturalWidth || tile.width;
          canvas.height = tile.naturalHeight || tile.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.drawImage(tile, 0, 0);
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const data = ctx.getImageData(Math.floor(px * scaleX), Math.floor(py * scaleY), 1, 1).data;
          const [r, g, b, a] = data;
          if (a < 30) continue; // transparent tile — skip
          // Map brightness/color to Bortle
          const brightness = (r + g + b) / 3;
          if (brightness > 220) return 9;
          if (brightness > 180) return 8;
          if (r > 180 && g < 120) return 7;
          if (r > 150 && g > 80 && b < 80) return 6;
          if (r > 120 && g > 120 && b < 80) return 5;
          if (g > 80 && r < 100 && b < 80) return 4;
          if (g > 50 && r < 80) return 3;
          if (brightness < 30) return 1;
          return 2;
        } catch { continue; } // CORS — can't read pixel
      }
    }
  } catch {}
  return 5; // fallback
}

const LightPollutionMap = () => {
  const { t } = useTranslation("lightpollution");
  const [lat, setLat] = useState(45.7347);
  const [lng, setLng] = useState(4.4931);
  const [overlayOpacity, setOverlayOpacity] = useState([0.6]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; bortle: number } | null>(null);
  const [selectedBortle, setSelectedBortle] = useState<number | undefined>(undefined);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const overlay = L.tileLayer(
      "https://djlorenz.github.io/astronomy/image_tiles/tiles2024/tile_{z}_{x}_{y}.png",
      {
        opacity: 0.5,
        maxZoom: 8,
        tileSize: 1024,
        zoomOffset: -2,
        attribution: 'Light pollution: <a href="https://djlorenz.github.io/astronomy/lp/">D. Lorenz Atlas 2024</a>',
      }
    );
    overlay.addTo(map);
    overlayRef.current = overlay;

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>${t("map.yourPosition")}</b><br/>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    markerRef.current = marker;

    map.on("click", (e: L.LeafletMouseEvent) => {
      // Attempt to read Bortle from tile pixel color
      const bortle = estimateBortleFromClick(map, e.latlng);
      setClickedPoint({ lat: e.latlng.lat, lng: e.latlng.lng, bortle });
      setSelectedBortle(bortle);
    });

    // Add color legend control
    const legend = new L.Control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "");
      div.innerHTML = `
        <div style="background:rgba(0,0,0,0.75);border-radius:8px;padding:6px 8px;font-size:10px;color:#ccc;max-width:140px;line-height:1.6;">
          <div style="font-weight:600;margin-bottom:3px;color:#fff;">${t("map.legendTitle")}</div>
          <div style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#333;border:1px solid #555;"></span> B1–B2</div>
          <div style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#2d6a4f;"></span> B3–B4</div>
          <div style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#e9c46a;"></span> B5</div>
          <div style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#e76f51;"></span> B6–B7</div>
          <div style="display:flex;align-items:center;gap:5px;"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#e63946;"></span> B8–B9</div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current.setPopupContent(`<b>${t("map.yourPosition")}</b><br/>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
  }, [lat, lng]);

  useEffect(() => {
    overlayRef.current?.setOpacity(overlayOpacity[0]);
  }, [overlayOpacity]);

  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);
  }, [isFullscreen]);

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 10);
        },
        () => toast.error(t("map.locationDenied"))
      );
    }
  };

  const handleSelectCity = useCallback((cityLat: number, cityLng: number, _name: string) => {
    setLat(cityLat);
    setLng(cityLng);
    mapRef.current?.setView([cityLat, cityLng], 10);
  }, []);

  const handleSelectDarkSite = useCallback((site: DarkSite) => {
    setLat(site.lat);
    setLng(site.lng);
    mapRef.current?.setView([site.lat, site.lng], 10);
    setClickedPoint({ lat: site.lat, lng: site.lng, bortle: site.bortle });
    setSelectedBortle(site.bortle);
  }, []);

  return (
    <div className={`min-h-screen bg-background star-field ${isFullscreen ? "overflow-hidden" : ""}`}>
      <SEOHead
        title="Light Pollution Map — Find Dark Skies"
        description="Interactive light pollution map for astrophotography. Find Bortle 1-4 dark sky sites near you using the D. Lorenz Atlas 2024 overlay. Search any location worldwide."
        keywords="light pollution, Bortle map, astronomy observation site, dark sky, light pollution map, best astrophoto spot"
        canonical="https://cosmicframe.app/light-pollution"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the Bortle scale?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The Bortle scale is a nine-level numeric classification of sky darkness, from class 1 (pristine, star-filled skies) to class 9 (inner-city glow). It measures how much artificial light brightens the night sky, directly affecting how many stars you can see and how well cameras capture faint nebulae and galaxies."
              }
            },
            {
              "@type": "Question",
              "name": "How do I find dark skies near me?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Use our interactive light pollution map to scout Bortle 1–4 dark sky sites near your location. Click anywhere on the map to sample the light pollution level, or search for parks, reserves and certified dark sky locations in the Nearby Dark Sky Sites panel. Driving even 30–60 minutes from a city can dramatically improve your imaging quality."
              }
            }
          ]
        }}
      />
      {!isFullscreen && <AppNav />}

      <main className={isFullscreen ? "h-screen flex flex-col" : "max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6"}>
        {!isFullscreen && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-foreground">{t("heading")}</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                {t("subheading")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card rounded-2xl p-4 flex flex-wrap items-end gap-3"
            >
              <CitySearch onSelectCity={handleSelectCity} />
              <Button size="sm" variant="outline" onClick={handleGeolocate} className="h-9 gap-1.5">
                <Locate className="w-3.5 h-3.5" /> {t("toolbar.myLocation")}
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("toolbar.opacity")}</Label>
                <Slider value={overlayOpacity} onValueChange={setOverlayOpacity} min={0} max={1} step={0.05} className="w-24" />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(true)} className="h-9 gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          </>
        )}

        <div
          className={`relative ${isFullscreen ? "flex-1" : "glass-card rounded-2xl overflow-hidden"}`}
          style={!isFullscreen ? { height: "calc(100vh - 420px)", minHeight: "400px" } : undefined}
        >
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-[1000] flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsFullscreen(false)} className="h-8 gap-1.5 shadow-lg">
                <Minimize2 className="w-3.5 h-3.5" /> {t("toolbar.exitFullscreen")}
              </Button>
            </div>
          )}

          {clickedPoint && (
            <div className="absolute top-4 left-4 z-[1000] w-72">
              <BortleInfoPanel
                lat={clickedPoint.lat}
                lng={clickedPoint.lng}
                bortle={clickedPoint.bortle}
                onClose={() => setClickedPoint(null)}
              />
            </div>
          )}

          <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
        </div>

        {!isFullscreen && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <DarkSitesFinder userLat={lat} userLng={lng} onSelectSite={handleSelectDarkSite} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <ImagingImpactCard selectedBortle={selectedBortle} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 space-y-3"
            >
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("bortle.sectionTitle")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BORTLE_SCALE.map((b) => (
                  <div key={b.level} className="flex items-center gap-3 py-1">
                    <div className="w-5 h-5 rounded-sm shrink-0 border border-border" style={{ backgroundColor: b.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{t("bortle.prefix")} {b.level} — {t(`bortle.labels.${b.level}`)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{t("bortle.sqmPrefix")} {b.sqm}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <details className="space-y-4 pt-6 border-t border-border/20" itemScope itemType="https://schema.org/FAQPage">
              <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
                {t("faq.title")}
              </summary>
              <div className="space-y-4 pt-4">
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                    {t("faq.items.bortle.q")}
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                      {t("faq.items.bortle.a")}
                    </p>
                  </div>
                </div>
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                    {t("faq.items.findDark.q")}
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                      {t("faq.items.findDark.a")}
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </details>

            <details className="space-y-4 pt-6 border-t border-border/20">
              <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
                {t("about.title")}
              </summary>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {t("about.p1_before")}
                  <span className="text-foreground/80 font-medium">{t("about.p1_bortle")}</span>
                  {t("about.p1_after")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  <span className="text-foreground/80 font-medium">{t("about.p2_sqm")}</span>
                  {t("about.p2_after")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {t("about.p3")}
                </p>
              </div>
            </details>
          </>
        )}
      </main>

      {!isFullscreen && <Footer />}
    </div>
  );
};

export default LightPollutionMap;
