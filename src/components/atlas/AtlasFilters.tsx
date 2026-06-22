import { CelestialFilters, TypeBucket } from "@/hooks/useCelestialObjects";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Trophy, Star, Moon, Camera } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  filters: CelestialFilters;
  onChange: (f: CelestialFilters) => void;
  types: string[];
  typeBuckets?: TypeBucket[];
  constellations: string[];
  totalCount: number;
  visibleTonightEnabled?: boolean;
  onToggleVisibleTonight?: () => void;
  filterMode?: string;
  onFilterModeChange?: (mode: string) => void;
  minHoursVisible?: number;
  onMinHoursVisibleChange?: (hours: number) => void;
}

const AtlasFilters = ({ filters, onChange, types, typeBuckets, constellations, totalCount, visibleTonightEnabled, onToggleVisibleTonight, filterMode, onFilterModeChange, minHoursVisible, onMinHoursVisibleChange }: Props) => {
  const isTop50 = filters.limitResults === 50;

  // Fallback buckets when caller didn't pass them (preserves legacy behavior).
  const buckets: TypeBucket[] = useMemo(
    () => typeBuckets ?? types.map((t) => ({ label: t, count: 0, values: [t] })),
    [typeBuckets, types],
  );

  const toggleBucket = (b: TypeBucket) => {
    const active = b.values.some((v) => filters.objTypes.includes(v));
    const next = active
      ? filters.objTypes.filter((x) => !b.values.includes(x))
      : [...filters.objTypes, ...b.values.filter((v) => !filters.objTypes.includes(v))];
    onChange({ ...filters, objTypes: next, limitResults: undefined });
  };

  const toggleTop50 = () => {
    if (isTop50) {
      onChange({ ...filters, limitResults: undefined });
    } else {
      onChange({
        ...filters,
        sortBy: "photo_score",
        limitResults: 50,
        objTypes: [],
        search: "",
        constellation: "",
        maxMagnitude: 20,
        minPhotoScore: 0,
        minSize: 0,
        maxSize: 300,
      });
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isTop50 ? "default" : "outline"}
          size="sm"
          onClick={toggleTop50}
          className={`gap-1.5 text-xs ${isTop50 ? "bg-primary text-primary-foreground" : ""}`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Top 50 Essentials
          {isTop50 && <X className="w-3 h-3 ml-1" />}
        </Button>

        {onToggleVisibleTonight && (
          <Button
            variant={visibleTonightEnabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleVisibleTonight}
            className={`gap-1.5 text-xs ${visibleTonightEnabled ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Moon className="w-3.5 h-3.5" />
            🌙 Visible Tonight
            {visibleTonightEnabled && <X className="w-3 h-3 ml-1" />}
          </Button>
        )}

        {onFilterModeChange && (
          <>
            <Button
              variant={filterMode === "rgb" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterModeChange(filterMode === "rgb" ? "all" : "rgb")}
              className={`gap-1.5 text-xs ${filterMode === "rgb" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Camera className="w-3.5 h-3.5" />
              RGB/Broadband
              {filterMode === "rgb" && <X className="w-3 h-3 ml-1" />}
            </Button>
            <Button
              variant={filterMode === "narrowband" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterModeChange(filterMode === "narrowband" ? "all" : "narrowband")}
              className={`gap-1.5 text-xs ${filterMode === "narrowband" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Camera className="w-3.5 h-3.5" />
              Narrowband (SHO)
              {filterMode === "narrowband" && <X className="w-3 h-3 ml-1" />}
            </Button>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search NGC, IC, Messier, name..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value, limitResults: undefined })}
          className="pl-10 bg-secondary/50 border-border/30"
        />
      </div>

      {/* Catalog quick filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground mr-1">Catalogs:</span>
        {([
          { key: "M", label: "Messier" },
          { key: "NGC", label: "NGC" },
          { key: "IC", label: "IC" },
        ] as const).map((cat) => {
          const active = filters.catalog === cat.key;
          return (
            <Button
              key={cat.key}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onChange({
                  ...filters,
                  catalog: active ? undefined : cat.key,
                  limitResults: undefined,
                })
              }
              className={`text-xs h-7 px-2.5 ${active ? "bg-primary text-primary-foreground" : ""}`}
            >
              {cat.label}
              {active && <X className="w-3 h-3 ml-1" />}
            </Button>
          );
        })}
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

        <div className="space-y-1 min-w-[220px] flex-1">
          <label className="text-xs text-muted-foreground">
            Size: {filters.minSize > 0 ? `${filters.minSize}'` : "0'"} — {filters.maxSize < 300 ? `${filters.maxSize}'` : "Any"}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">Min</span>
              <Slider
                value={[filters.minSize]}
                onValueChange={([v]) => onChange({ ...filters, minSize: v })}
                min={0}
                max={120}
                step={1}
                className="py-1"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">Max</span>
              <Slider
                value={[filters.maxSize]}
                onValueChange={([v]) => onChange({ ...filters, maxSize: v })}
                min={1}
                max={300}
                step={1}
                className="py-1"
              />
            </div>
          </div>
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

        <div className="space-y-1 min-w-[180px] flex-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="w-3 h-3 text-primary" />
            Min Photo Score: {filters.minPhotoScore > 0 ? filters.minPhotoScore : "All"}
          </label>
          <Slider
            value={[filters.minPhotoScore]}
            onValueChange={([v]) => onChange({ ...filters, minPhotoScore: v })}
            min={0}
            max={100}
            step={5}
            className="py-2"
          />
        </div>

        {visibleTonightEnabled && onMinHoursVisibleChange != null && (
          <div className="space-y-1 min-w-[180px] flex-1">
            <label className="text-xs text-muted-foreground">
              🕐 Min hours visible: {(minHoursVisible ?? 0) > 0 ? `${(minHoursVisible ?? 0)}h+` : "All"}
            </label>
            <Slider
              value={[minHoursVisible ?? 0]}
              onValueChange={([v]) => onMinHoursVisibleChange(v)}
              min={0}
              max={10}
              step={1}
              className="py-2"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {totalCount.toLocaleString()} objects
        </div>
      </div>

      {buckets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {buckets.map((b) => {
            const active = b.values.some((v) => filters.objTypes.includes(v));
            return (
              <Badge
                key={b.label}
                variant={active ? "default" : "secondary"}
                className="cursor-pointer text-[10px] px-2 py-0.5 transition-colors inline-flex items-center gap-1"
                onClick={() => toggleBucket(b)}
              >
                <span>{b.label}</span>
                {b.count > 0 && (
                  <span className={`text-[9px] tabular-nums ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {b.count.toLocaleString()}
                  </span>
                )}
                {active && <X className="w-3 h-3" />}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AtlasFilters;
