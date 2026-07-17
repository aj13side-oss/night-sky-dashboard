import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
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

/** Recompute tile positions once the dialog animation settles + when tab switches. */
const InvalidateOnMount = ({ trigger }: { trigger: unknown }) => {
  const map = useMap();
  useEffect(() => {
    const timers = [50, 150, 350].map((ms) =>
      setTimeout(() => map.invalidateSize(), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [map, trigger]);
  return null;
};

const ClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

/** Keep the map centered on the current coords when they change from outside (GPS tab edits). */
const RecenterOnChange = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: false });
  }, [lat, lng, map]);
  return null;
};

const CustomLocationModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation("common");
  const { location, setCustomLocation, clearCustom } = useObservation();
  const existing = useMemo(() => readCustomLocation(), [open]);

  const [label, setLabel] = useState("");
  const [lat, setLat] = useState<number>(location.lat);
  const [lng, setLng] = useState<number>(location.lng);
  const [latInput, setLatInput] = useState(String(location.lat));
  const [lngInput, setLngInput] = useState(String(location.lng));
  const [dmsLat, setDmsLat] = useState("");
  const [dmsLng, setDmsLng] = useState("");
  const [showDms, setShowDms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"map" | "coords">("map");
  const markerRef = useRef<L.Marker | null>(null);

  // Reset state on every open
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
    setDmsLat("");
    setDmsLng("");
    setShowDms(false);
    setError(null);
    setTab("map");
  }, [open]);

  const pickOnMap = (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    setLatInput(la.toFixed(5));
    setLngInput(ln.toFixed(5));
    setError(null);
  };

  const parsedLat = parseFloat(latInput);
  const parsedLng = parseFloat(lngInput);
  const coordsValid = isValidLat(parsedLat) && isValidLng(parsedLng);

  const applyCoords = () => {
    if (!coordsValid) {
      setError(t("location.custom.errorInvalidCoords"));
      return false;
    }
    setLat(parsedLat);
    setLng(parsedLng);
    setError(null);
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
  };

  const onSave = () => {
    if (!coordsValid) {
      setError(t("location.custom.errorInvalidCoords"));
      return;
    }
    // Sync from GPS inputs if user typed but didn't apply
    const finalLat = parsedLat;
    const finalLng = parsedLng;
    const trimmed = label.trim();
    if (!trimmed) {
      setError(t("location.custom.errorLabelRequired"));
      return;
    }
    setCustomLocation({ label: trimmed.slice(0, 60), lat: finalLat, lng: finalLng });
    onOpenChange(false);
  };

  const onDelete = () => {
    clearCustom();
    onOpenChange(false);
  };

  const saveDisabled = !coordsValid || !label.trim();

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

          <TabsContent value="map" forceMount className="mt-3 space-y-2 data-[state=inactive]:hidden">
            <div
              className="w-full h-64 rounded-lg overflow-hidden border border-border/50 bg-secondary/20"
              aria-label={t("location.custom.mapAria")}
            >
              {open && (
                <MapContainer
                  center={[lat, lng]}
                  zoom={10}
                  scrollWheelZoom
                  style={{ width: "100%", height: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <Marker
                    position={[lat, lng]}
                    draggable
                    ref={(r) => { markerRef.current = r; }}
                    eventHandlers={{
                      dragend: (e) => {
                        const m = e.target as L.Marker;
                        const { lat: la, lng: ln } = m.getLatLng();
                        pickOnMap(la, ln);
                      },
                    }}
                  />
                  <ClickHandler onPick={pickOnMap} />
                  <RecenterOnChange lat={lat} lng={lng} />
                  <InvalidateOnMount trigger={tab} />
                </MapContainer>
              )}
            </div>
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
                  type="number"
                  inputMode="decimal"
                  step="0.00001"
                  min={-90}
                  max={90}
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="45.7618"
                  aria-invalid={!isValidLat(parsedLat)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-lng" className="text-xs">{t("location.custom.longitude")}</Label>
                <Input
                  id="cf-lng"
                  type="number"
                  inputMode="decimal"
                  step="0.00001"
                  min={-180}
                  max={180}
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="4.4993"
                  aria-invalid={!isValidLng(parsedLng)}
                />
              </div>
            </div>
            {!coordsValid && (latInput || lngInput) && (
              <p className="text-xs text-destructive">{t("location.custom.errorInvalidCoords")}</p>
            )}
            <Button size="sm" variant="secondary" onClick={applyCoords} disabled={!coordsValid}>
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
          <Button onClick={onSave} disabled={saveDisabled} className="gap-2">
            <Save className="w-4 h-4" /> {t("location.custom.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomLocationModal;
