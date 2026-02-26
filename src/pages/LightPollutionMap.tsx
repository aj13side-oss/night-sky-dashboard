import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Locate } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const LightPollutionMap = () => {
  const [lat, setLat] = useState(48.8566);
  const [lng, setLng] = useState(2.3522);
  const [latInput, setLatInput] = useState("48.8566");
  const [lngInput, setLngInput] = useState("2.3522");
  const [overlayOpacity, setOverlayOpacity] = useState([0.6]);

  const handleSetLocation = () => {
    const newLat = parseFloat(latInput);
    const newLng = parseFloat(lngInput);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setLat(newLat);
      setLng(newLng);
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLatInput(pos.coords.latitude.toFixed(4));
          setLngInput(pos.coords.longitude.toFixed(4));
        },
        () => alert("Geolocation denied or unavailable")
      );
    }
  };

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-foreground">Light Pollution Map</h2>
          <p className="text-muted-foreground mt-1">
            Find dark sky sites for astrophotography — VIIRS 2023 satellite data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-4 flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input value={latInput} onChange={(e) => setLatInput(e.target.value)} className="bg-secondary/50 font-mono w-28 h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input value={lngInput} onChange={(e) => setLngInput(e.target.value)} className="bg-secondary/50 font-mono w-28 h-9" />
          </div>
          <Button size="sm" onClick={handleSetLocation} className="h-9 gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Go
          </Button>
          <Button size="sm" variant="outline" onClick={handleGeolocate} className="h-9 gap-1.5">
            <Locate className="w-3.5 h-3.5" /> My Location
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Overlay opacity</Label>
            <Slider value={overlayOpacity} onValueChange={setOverlayOpacity} min={0} max={1} step={0.05} className="w-28" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl overflow-hidden"
          style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}
        >
          <MapContainer center={[lat, lng]} zoom={7} style={{ height: "100%", width: "100%" }} className="z-0">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <TileLayer
              url="https://tiles.lightpollutionmap.info/tiles/viirs_2023/{z}/{x}/{y}.png"
              opacity={overlayOpacity[0]}
              attribution='Light pollution data &copy; <a href="https://www.lightpollutionmap.info">lightpollutionmap.info</a>'
            />
            <Marker position={[lat, lng]}>
              <Popup>
                <span className="text-sm font-medium">Your location</span><br />
                <span className="text-xs">{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
              </Popup>
            </Marker>
            <MapRecenter lat={lat} lng={lng} />
          </MapContainer>
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
      </main>
    </div>
  );
};

export default LightPollutionMap;
