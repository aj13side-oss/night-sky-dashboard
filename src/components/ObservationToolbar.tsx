import { useObservation } from "@/contexts/ObservationContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, MapPin, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const PRESET_LOCATIONS = [
  { name: "Paris, FR", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  { name: "Brullioles, FR", lat: 45.7333, lng: 4.4833, timezone: "Europe/Paris" },
  { name: "Pic du Midi, FR", lat: 42.9369, lng: 0.1411, timezone: "Europe/Paris" },
  { name: "La Palma, ES", lat: 28.7564, lng: -17.8926, timezone: "Atlantic/Canary" },
  { name: "Mauna Kea, US", lat: 19.8207, lng: -155.4681, timezone: "Pacific/Honolulu" },
  { name: "Atacama, CL", lat: -24.6275, lng: -70.4042, timezone: "America/Santiago" },
];

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const ObservationToolbar = () => {
  const { date, setDate, time, setTime, location, setLocation } = useObservation();
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocations, setShowLocations] = useState(false);
  const [latInput, setLatInput] = useState(String(location.lat));
  const [lngInput, setLngInput] = useState(String(location.lng));

  // Nominatim search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredLocations = PRESET_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const resolveTimezone = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.timeZone || "UTC";
      }
    } catch {}
    const offset = Math.round(lng / 15);
    return `Etc/GMT${offset <= 0 ? "+" : ""}${-offset}`;
  };

  const handleCustomCoords = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      const timezone = await resolveTimezone(lat, lng);
      setLocation({ name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng, timezone });
    }
  };

  const handleNominatimSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { "Accept-Language": "fr,en" } }
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const timezone = await resolveTimezone(lat, lng);
    const name = r.display_name.split(",").slice(0, 2).join(",").trim();
    setLocation({ name, lat, lng, timezone });
    setSearchQuery(name);
    setLatInput(String(lat));
    setLngInput(String(lng));
    setShowResults(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      {/* Location search — prominent */}
      <div className="relative" ref={searchRef}>
        <div className="flex gap-2 items-center">
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNominatimSearch()}
              placeholder="Search a location…"
              className="pl-9 h-10 bg-secondary/50 text-base"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNominatimSearch}
            disabled={isSearching}
            className="h-10 px-3"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
          <Popover open={showLocations} onOpenChange={setShowLocations}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-muted-foreground hover:text-foreground">
                <span className="max-w-[140px] truncate text-sm">{location.name}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="end">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter presets..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="pl-8 h-9 text-sm bg-secondary/50"
                />
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setLocation(loc);
                      setLatInput(String(loc.lat));
                      setLngInput(String(loc.lng));
                      setSearchQuery(loc.name);
                      setShowLocations(false);
                    }}
                    className={cn(
                      "w-full text-left text-sm px-2.5 py-1.5 rounded-md transition-colors",
                      location.name === loc.name
                        ? "bg-primary/20 text-primary"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    {loc.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-xs text-muted-foreground mb-2">Custom coordinates</p>
                <div className="flex gap-2">
                  <Input placeholder="Lat" value={latInput} onChange={(e) => setLatInput(e.target.value)} className="h-8 text-xs bg-secondary/50 font-mono" />
                  <Input placeholder="Lng" value={lngInput} onChange={(e) => setLngInput(e.target.value)} className="h-8 text-xs bg-secondary/50 font-mono" />
                  <Button size="sm" onClick={handleCustomCoords} className="h-8 px-3 text-xs">Set</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Nominatim results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg z-50">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectSearchResult(r)}
                className="flex items-start gap-2 w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors text-sm"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date, time & coords */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal gap-2 bg-secondary/50 border-border hover:bg-secondary",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-4 h-4 text-primary" />
              {date ? format(date, "MMM d, yyyy") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-md px-3 py-2">
          <Clock className="w-4 h-4 text-primary" />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-transparent text-sm text-foreground outline-none font-mono w-[70px]"
          />
        </div>

        <span className="text-xs font-mono text-muted-foreground hidden lg:inline">
          {location.lat.toFixed(4)}° N, {Math.abs(location.lng).toFixed(4)}° {location.lng >= 0 ? "E" : "W"} · {location.timezone}
        </span>
      </div>
    </motion.div>
  );
};

export default ObservationToolbar;
