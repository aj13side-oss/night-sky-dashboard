import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useObservation } from "@/contexts/ObservationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Locate, Search, Loader2, X, Crosshair } from "lucide-react";
import CustomLocationModal from "@/components/CustomLocationModal";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker() {
  const { t } = useTranslation("common");
  const { location, setLocation, clearCustom, isDetectingLocation } = useObservation();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [pendingCity, setPendingCity] = useState<NominatimResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        setResults(await res.json());
      } catch {}
      setSearching(false);
    }, 400);
  };

  const applyCity = (r: NominatimResult) => {
    const parts = r.display_name.split(",");
    const name = parts.length >= 2
      ? `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`
      : r.display_name;
    setLocation({
      name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setOpen(false);
    setQuery("");
    setResults([]);
    setPendingCity(null);
  };

  const pick = (r: NominatimResult) => {
    if (location.isCustom) {
      // Confirm replacing the custom spot with a city.
      setPendingCity(r);
      return;
    }
    applyCity(r);
  };

  const geoLocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let name = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
          const country = data.address?.country_code?.toUpperCase();
          if (city && country) name = `${city}, ${country}`;
        } catch {}
        setLocation({ name, lat, lng, timezone });
        setGeoLoading(false);
        setOpen(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

  const handleClearCustom = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearCustom();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-secondary/50 transition-colors ${
              location.isCustom
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isDetectingLocation
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <MapPin className="w-3.5 h-3.5" />}
            <span className="max-w-[160px] truncate">
              {location.isCustom ? `📍 ${location.name}` : location.name}
            </span>
            {location.isCustom && (
              <>
                <span className="text-[10px] text-muted-foreground">({t("location.customSuffix")})</span>
                <button
                  type="button"
                  onClick={handleClearCustom}
                  aria-label={t("location.clearCustom")}
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("location.setYourLocation")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Button variant="outline" className="w-full gap-2" onClick={geoLocate} disabled={geoLoading}>
              {geoLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Locate className="w-4 h-4" />}
              {t("actions.useMyLocation")}
            </Button>

            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => { setOpen(false); setCustomOpen(true); }}
            >
              <Crosshair className="w-4 h-4" />
              {t("location.pickCustom")}
            </Button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("location.searchPlaceholder")}
                className="pl-9"
                value={query}
                onChange={(e) => search(e.target.value)}
              />
            </div>

            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {results.length > 0 && (
              <ul className="border border-border/50 rounded-lg divide-y divide-border/50 overflow-hidden">
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                      onClick={() => pick(r)}
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("location.storageNote")}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <CustomLocationModal open={customOpen} onOpenChange={setCustomOpen} />

      <AlertDialog open={!!pendingCity} onOpenChange={(v) => !v && setPendingCity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("location.replaceCustomTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("location.replaceCustomBody", {
                current: location.name,
                next: pendingCity?.display_name?.split(",")[0] ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("location.custom.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingCity && applyCity(pendingCity)}>
              {t("location.replaceConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
