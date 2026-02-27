import { CelestialFilters } from "@/hooks/useCelestialObjects";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface Props {
  filters: CelestialFilters;
  onChange: (f: CelestialFilters) => void;
  types: string[];
  constellations: string[];
  totalCount: number;
}

const AtlasFilters = ({ filters, onChange, types, constellations, totalCount }: Props) => {
  const toggleType = (t: string) => {
    const next = filters.objTypes.includes(t)
      ? filters.objTypes.filter((x) => x !== t)
      : [...filters.objTypes, t];
    onChange({ ...filters, objTypes: next });
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search NGC, IC, Messier, name..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-secondary/50 border-border/30"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground">Constellation</label>
          <Select
            value={filters.constellation || "__all__"}
            onValueChange={(v) => onChange({ ...filters, constellation: v === "__all__" ? "" : v })}
          >
            <SelectTrigger className="bg-secondary/50 border-border/30 h-9 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="__all__">All constellations</SelectItem>
              {constellations.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[150px]">
          <label className="text-xs text-muted-foreground">Sort by</label>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange({ ...filters, sortBy: v as CelestialFilters["sortBy"] })}
          >
            <SelectTrigger className="bg-secondary/50 border-border/30 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tonight_best">⭐ Tonight's Best</SelectItem>
              <SelectItem value="photo_score">Photo Score ↓</SelectItem>
              <SelectItem value="magnitude">Magnitude ↑</SelectItem>
              <SelectItem value="size_max">Size ↓</SelectItem>
              <SelectItem value="catalog_id">Catalog ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[130px]">
          <label className="text-xs text-muted-foreground">Target Size</label>
          <Select
            value={filters.sizeCategory || "__all__"}
            onValueChange={(v) => onChange({ ...filters, sizeCategory: (v === "__all__" ? "" : v) as CelestialFilters["sizeCategory"] })}
          >
            <SelectTrigger className="bg-secondary/50 border-border/30 h-9 text-xs">
              <SelectValue placeholder="All sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sizes</SelectItem>
              <SelectItem value="small">Small (&lt;5')</SelectItem>
              <SelectItem value="medium">Medium (5–30')</SelectItem>
              <SelectItem value="large">Large (&gt;30')</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[180px] flex-1">
          <label className="text-xs text-muted-foreground">
            Max magnitude: {filters.maxMagnitude < 20 ? filters.maxMagnitude.toFixed(1) : "All"}
          </label>
          <Slider
            value={[filters.maxMagnitude]}
            onValueChange={([v]) => onChange({ ...filters, maxMagnitude: v })}
            min={0}
            max={20}
            step={0.5}
            className="py-2"
          />
        </div>

        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {totalCount.toLocaleString()} objects
        </div>
      </div>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <Badge
              key={t}
              variant={filters.objTypes.includes(t) ? "default" : "secondary"}
              className="cursor-pointer text-[10px] px-2 py-0.5 transition-colors"
              onClick={() => toggleType(t)}
            >
              {t}
              {filters.objTypes.includes(t) && <X className="w-3 h-3 ml-1" />}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtlasFilters;
