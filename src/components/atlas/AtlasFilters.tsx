import { CelestialFilters } from "@/hooks/useCelestialObjects";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Trophy, Star, Moon, Camera, Heart } from "lucide-react";
import { useState } from "react";

interface Props {
  filters: CelestialFilters;
  onChange: (f: CelestialFilters) => void;
  types: string[];
  constellations: string[];
  totalCount: number;
  visibleTonightEnabled?: boolean;
  onToggleVisibleTonight?: () => void;
  filterMode?: string;
  onFilterModeChange?: (mode: string) => void;
}

const AtlasFilters = ({ filters, onChange, types, constellations, totalCount, visibleTonightEnabled, onToggleVisibleTonight, filterMode, onFilterModeChange }: Props) => {
  const isTop50 = filters.limitResults === 50;

  const toggleType = (t: string) => {
    const next = filters.objTypes.includes(t)
      ? filters.objTypes.filter((x) => x !== t)
      : [...filters.objTypes, t];
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
        sizeCategory: "",
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
