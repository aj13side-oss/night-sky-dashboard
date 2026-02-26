import { useObservation } from "@/contexts/ObservationContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, MapPin, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

const PRESET_LOCATIONS = [
  { name: "Paris, FR", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  { name: "Brullioles, FR", lat: 45.7333, lng: 4.4833, timezone: "Europe/Paris" },
  { name: "Pic du Midi, FR", lat: 42.9369, lng: 0.1411, timezone: "Europe/Paris" },
  { name: "La Palma, ES", lat: 28.7564, lng: -17.8926, timezone: "Atlantic/Canary" },
  { name: "Mauna Kea, US", lat: 19.8207, lng: -155.4681, timezone: "Pacific/Honolulu" },
  { name: "Atacama, CL", lat: -24.6275, lng: -70.4042, timezone: "America/Santiago" },
];

const ObservationToolbar = () => {
  const { date, setDate, time, setTime, location, setLocation } = useObservation();
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocations, setShowLocations] = useState(false);
  const [latInput, setLatInput] = useState(String(location.lat));
  const [lngInput, setLngInput] = useState(String(location.lng));

  const filteredLocations = PRESET_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleCustomCoords = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      let timezone = "UTC";
      try {
        const res = await fetch(
          `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
        );
        if (res.ok) {
          const data = await res.json();
          timezone = data.timeZone || "UTC";
        }
      } catch {
        const offset = Math.round(lng / 15);
        timezone = `Etc/GMT${offset <= 0 ? "+" : ""}${-offset}`;
      }
      setLocation({ name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng, timezone });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3"
    >
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

      <Popover open={showLocations} onOpenChange={setShowLocations}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal gap-2 bg-secondary/50 border-border hover:bg-secondary"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="max-w-[160px] truncate">{location.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 space-y-3" align="start">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search location..."
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
              <Input
                placeholder="Lat"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="h-8 text-xs bg-secondary/50 font-mono"
              />
              <Input
                placeholder="Lng"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                className="h-8 text-xs bg-secondary/50 font-mono"
              />
              <Button size="sm" onClick={handleCustomCoords} className="h-8 px-3 text-xs">
                Set
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-xs font-mono text-muted-foreground hidden lg:inline">
        {location.lat.toFixed(4)}° N, {Math.abs(location.lng).toFixed(4)}° {location.lng >= 0 ? "E" : "W"} · {location.timezone}
      </span>
    </motion.div>
  );
};

export default ObservationToolbar;
