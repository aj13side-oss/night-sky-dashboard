import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Save, Trash2, AlertTriangle } from "lucide-react";
import { useObservation } from "@/contexts/ObservationContext";
import {
  isValidLat, isValidLng, parseDMS, readCustomLocation,
} from "@/lib/custom-location";

// Ensure default marker icons resolve (Leaflet bundler quirk).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CustomLocationModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation("common");
  const { location, setCustomLocation, clearCustom } = useObservation();
  const existing = readCustomLocation();

  const initial = existing ?? {
    label: location.isCustom ? location.name : "",
    lat: location.lat,
    lng: location.lng,
  };

  const [label, setLabel] = useState(initial.label);
  const [lat, setLat] = useState<number>(initial.lat);
  const [lng, setLng] = useState<number>(initial.lng);
  const [latInput, setLatInput] = useState(String(initial.lat));
  const [lngInput, setLngInput] = useState(String(initial.lng));
  const [dmsLat, setDmsLat] = useState("");
  const [dmsLng, setDmsLng] = useState("");
  const [showDms, setShowDms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"map" | "coords">("map");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (!open) return;
    const cur = readCustomLocation() ?? {
      label: location.isCustom ? location.name : "",
      lat: location.lat,
      lng: location.lng,
    };
    setLabel(cur.label);
    setLat(cur.lat);
    setLng(cur.lng);
    setLatInput(String(cur.lat));
    setLngInput(String(cur.lng));
    setError(null);
    setTab("map");
  }, [open]);

  // Initialise Leaflet after the map tab is visible.
  useEffect(() => {
    if (!open || tab !== "map") return;
    const el = mapContainerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([lat, lng], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const { lat: la, lng: ln } = marker.getLatLng();
      updateFromMap(la, ln);
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updateFromMap(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Invalidate size once the dialog animation settles so tiles render fully.
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const updateFromMap = (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    setLatInput(la.toFixed(5));
    setLngInput(ln.toFixed(5));
    setError(null);
  };

  const applyCoords = () => {
    const la = parseFloat(latInput);
    const ln = parseFloat(lngInput);
    if (!isValidLat(la) || !isValidLng(ln)) {
      setError(t("location.custom.errorInvalidCoords"));
      return false;
    }
    setLat(la);
    setLng(ln);
    setError(null);
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([la, ln]);
      mapRef.current.setView([la, ln], mapRef.current.getZoom());
    }
    return true;
  };

  const applyDms = () => {
    const la = parseDMS(dmsLat);
    const ln = parseDMS(dmsLng);
    if (la == null || ln == null || !isValidLat(la) || !isValidLng(ln)) {
      setError(t("location.custom.errorInvalidDms"));
      return;
    }
    setLatInput(la.toFixed(5));
    setLngInput(ln.toFixed(5));
    setLat(la);
    setLng(ln);
    setError(null);
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([la, ln]);
      mapRef.current.setView([la, ln], mapRef.current.getZoom());
    }
  };

  const onSave = () => {
    if (tab === "coords" && !applyCoords()) return;
    const trimmed = label.trim();
    if (!trimmed) {
      setError(t("location.custom.errorLabelRequired"));
      return;
    }
    if (!isValidLat(lat) || !isValidLng(lng)) {
      setError(t("location.custom.errorInvalidCoords"));
      return;
    }
    setCustomLocation({ label: trimmed.slice(0, 60), lat, lng });
    onOpenChange(false);
  };

  const onDelete = () => {
    clearCustom();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {t("location.custom.title")}
          </DialogTitle>
          <DialogDescription>{t("location.custom.description")}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "map" | "coords")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="map">{t("location.custom.tabMap")}</TabsTrigger>
            <TabsTrigger value="coords">{t("location.custom.tabCoords")}</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-3 space-y-2">
            <div
              ref={mapContainerRef}
              className="w-full h-64 rounded-lg overflow-hidden border border-border/50 bg-secondary/20"
              aria-label={t("location.custom.mapAria")}
            />
            <p className="text-xs text-muted-foreground">
              {t("location.custom.mapHint")} · <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </p>
          </TabsContent>

          <TabsContent value="coords" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-lat" className="text-xs">{t("location.custom.latitude")}</Label>
                <Input
                  id="cf-lat"
                  inputMode="decimal"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="45.7618"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-lng" className="text-xs">{t("location.custom.longitude")}</Label>
                <Input
                  id="cf-lng"
                  inputMode="decimal"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="4.4993"
                />
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={applyCoords}>
              {t("location.custom.applyCoords")}
            </Button>

            <div>
              <button
                type="button"
                onClick={() => setShowDms((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showDms ? "▾" : "▸"} {t("location.custom.dmsToggle")}
              </button>
              {showDms && (
                <div className="mt-2 space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={dmsLat}
                      onChange={(e) => setDmsLat(e.target.value)}
                      placeholder={`45°45'42"N`}
                    />
                    <Input
                      value={dmsLng}
                      onChange={(e) => setDmsLng(e.target.value)}
                      placeholder={`4°29'57"E`}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={applyDms}>
                    {t("location.custom.dmsConvert")}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <Label htmlFor="cf-label" className="text-xs">
            {t("location.custom.labelField")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cf-label"
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("location.custom.labelPlaceholder")}
          />
          <p className="text-[10px] text-muted-foreground text-right">{label.length}/60</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {existing && (
            <Button variant="ghost" onClick={onDelete} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" /> {t("location.custom.remove")}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("location.custom.cancel")}
          </Button>
          <Button onClick={onSave} className="gap-2">
            <Save className="w-4 h-4" /> {t("location.custom.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomLocationModal;
