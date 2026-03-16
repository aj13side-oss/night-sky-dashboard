import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  onSelectCity: (lat: number, lng: number, name: string) => void;
}

const CitySearch = ({ onSelectCity }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [noResults, setNoResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setNoResults(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "en,fr", "User-Agent": "CosmicFrame/1.0 (cosmicframe.app)" } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
      setNoResults(data.length === 0);
    } catch {
      setResults([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search on input change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 3) handleSearch();
    }, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSelect = (r: SearchResult) => {
    onSelectCity(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
    setQuery(r.display_name.split(",")[0]);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-1.5">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a city…"
          className="bg-secondary/50 h-9 w-48"
        />
        <Button size="sm" variant="outline" onClick={handleSearch} disabled={isLoading} className="h-9 gap-1.5">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg z-50">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors text-sm"
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-foreground line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
      {noResults && !isLoading && query.trim() && (
        <p className="text-xs text-muted-foreground mt-1.5">No results found. Try a city name or country.</p>
      )}
    </div>
  );
};

export default CitySearch;
