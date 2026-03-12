import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Locate, Maximize2, Minimize2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BortleInfoPanel from "@/components/lightpollution/BortleInfoPanel";
import DarkSitesFinder from "@/components/lightpollution/DarkSitesFinder";
import CitySearch from "@/components/lightpollution/CitySearch";
import ToolSuggestions from "@/components/ToolSuggestions";
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

const LightPollutionMap = () => {
  const [lat, setLat] = useState(48.8566);
  const [lng, setLng] = useState(2.3522);
  const [overlayOpacity, setOverlayOpacity] = useState([0.6]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; bortle: number } | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet map directly (bypassing react-leaflet entirely)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 7,
      zoomControl: true,
    });

    // Base layer with LOCAL language names (OpenStreetMap uses native names)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Light pollution overlay - D. Lorenz Light Pollution Atlas 2024
    // Uses 1024px tiles with underscore naming convention
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

    // User marker
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Votre position</b><br/>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    markerRef.current = marker;

    // Click handler
    map.on("click", (e: L.LeafletMouseEvent) => {
      setClickedPoint({ lat: e.latlng.lat, lng: e.latlng.lng, bortle: 5 });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center & marker when lat/lng change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current.setPopupContent(`<b>Votre position</b><br/>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
  }, [lat, lng]);

  // Update overlay opacity
  useEffect(() => {
    overlayRef.current?.setOpacity(overlayOpacity[0]);
  }, [overlayOpacity]);

  // Invalidate map size on fullscreen toggle
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
        () => alert("Géolocalisation refusée ou indisponible")
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
  }, []);

  return (
    <div className={`min-h-screen bg-background star-field ${isFullscreen ? "overflow-hidden" : ""}`}>
      {!isFullscreen && <AppNav />}

      <main className={isFullscreen ? "h-screen flex flex-col" : "max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6"}>
        {!isFullscreen && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold text-foreground">Light Pollution Map</h2>
              <p className="text-muted-foreground mt-1">
                Find the best observation sites — Light Pollution Atlas 2024
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
                <Locate className="w-3.5 h-3.5" /> My Location
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Opacity</Label>
                <Slider value={overlayOpacity} onValueChange={setOverlayOpacity} min={0} max={1} step={0.05} className="w-24" />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(true)} className="h-9 gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          </>
        )}

        {/* Map */}
        <div
          className={`relative ${isFullscreen ? "flex-1" : "glass-card rounded-2xl overflow-hidden"}`}
          style={!isFullscreen ? { height: "calc(100vh - 420px)", minHeight: "400px" } : undefined}
        >
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-[1000] flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsFullscreen(false)} className="h-8 gap-1.5 shadow-lg">
                <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DarkSitesFinder userLat={lat} userLng={lng} onSelectSite={handleSelectDarkSite} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card rounded-2xl p-6 space-y-3"
            >
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bortle Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BORTLE_SCALE.map((b) => (
                  <div key={b.level} className="flex items-center gap-3 py-1">
                    <div className="w-5 h-5 rounded-sm shrink-0 border border-border" style={{ backgroundColor: b.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Bortle {b.level} — {b.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">SQM {b.sqm}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <ToolSuggestions />
          </>
        )}
      </main>
    </div>
  );
};

export default LightPollutionMap;
