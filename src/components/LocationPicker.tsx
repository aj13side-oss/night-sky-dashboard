import { useState, useRef } from "react";
import { useObservation } from "@/contexts/ObservationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { MapPin, Locate, Search, Loader2 } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker() {
  const { location, setLocation, isDetectingLocation } = useObservation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
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

  const pick = (r: NominatimResult) => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          {isDetectingLocation
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <MapPin className="w-3.5 h-3.5" />}
          <span className="max-w-[140px] truncate">{location.name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set your location</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Button variant="outline" className="w-full gap-2" onClick={geoLocate} disabled={geoLoading}>
            {geoLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Locate className="w-4 h-4" />}
            Use my current location
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search city or place..."
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
            Your location is used for visibility calculations and is stored locally in your browser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
