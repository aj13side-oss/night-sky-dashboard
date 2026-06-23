import { CelestialFilters, TypeBucket, CatalogTypeCount } from "@/hooks/useCelestialObjects";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, X, Trophy, Star, Moon, Camera, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

interface NightWindow {
  startMs: number;
  endMs: number;
  minMs: number;
  maxMs: number;
  activePreset: "astro" | "nautical" | "civil" | "custom";
  presetAvail: { astro: boolean; nautical: boolean; civil: boolean };
  onPresetSelect: (key: "astro" | "nautical" | "civil") => void;
  onWindowChange: (startMs: number, endMs: number) => void;
  formatMs: (ms: number) => string;
}

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
  nightWindow?: NightWindow;
  typeCounts?: CatalogTypeCount[];
}

const AtlasFilters = ({
  filters,
  onChange,
  types,
  typeBuckets,
  constellations,
  totalCount,
  visibleTonightEnabled,
  onToggleVisibleTonight,
  filterMode,
  onFilterModeChange,
  nightWindow,
  typeCounts,
}: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Count active "detailed" filters for the drawer badge
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.catalog) n++;
    if (filters.constellation) n++;
    if (filters.minSize > 0 || filters.maxSize < 300) n++;
    if (filters.maxMagnitude < 20) n++;
    if (filters.minPhotoScore > 0) n++;
    if (isTop50) n++;
    if (filterMode && filterMode !== "all") n++;
    return n;
  }, [filters, isTop50, filterMode]);

  const nightDisabled = !visibleTonightEnabled;

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      {/* Top row: search + visible tonight + time window + sort + filters + count */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search NGC, IC, Messier, name..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value, limitResults: undefined })}
            className="pl-10 bg-secondary/50 border-border/30 h-9"
          />
        </div>

        {onToggleVisibleTonight && (
          <Button
            variant={visibleTonightEnabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleVisibleTonight}
            className={`gap-1.5 text-xs h-9 ${visibleTonightEnabled ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Moon className="w-3.5 h-3.5" />
            Visible Tonight
            {visibleTonightEnabled && <X className="w-3 h-3 ml-1" />}
          </Button>
        )}

        {/* Night window inline (always rendered, disabled when Visible Tonight is off) */}
        {nightWindow && (
          <div
            className={`flex items-center gap-2 flex-1 min-w-[320px] ${nightDisabled ? "opacity-50 pointer-events-none select-none" : ""}`}
            aria-disabled={nightDisabled}
          >
            <div className="flex items-center gap-1">
              {([
                { key: "astro", label: "Astro" },
                { key: "nautical", label: "Nautical" },
                { key: "civil", label: "Civil" },
              ] as const).map((p) => {
                const available = nightWindow.presetAvail[p.key];
                const active = nightWindow.activePreset === p.key;
                return (
                  <Button
                    key={p.key}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    disabled={nightDisabled || !available}
                    onClick={() => nightWindow.onPresetSelect(p.key)}
                    className={`text-xs h-8 px-2 ${active ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </div>
            <Slider
              value={[nightWindow.startMs, nightWindow.endMs]}
              onValueChange={([s, e]) => nightWindow.onWindowChange(s, e)}
              min={nightWindow.minMs}
              max={nightWindow.maxMs}
              step={5 * 60 * 1000}
              disabled={nightDisabled}
              className="flex-1 min-w-[120px]"
            />
            <span className="text-[11px] font-mono text-foreground/80 tabular-nums whitespace-nowrap">
              {nightWindow.formatMs(nightWindow.startMs)} → {nightWindow.formatMs(nightWindow.endMs)}
            </span>
          </div>
        )}

        {/* Sort control */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange({ ...filters, sortBy: v as CelestialFilters["sortBy"] })}
          >
            <SelectTrigger className="bg-secondary/50 border-border/30 h-9 text-xs w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tonight_best">⭐ Tonight's Best</SelectItem>
              {visibleTonightEnabled && (
                <SelectItem value="tonight_duration">🌙 Visibility duration ↓</SelectItem>
              )}
              <SelectItem value="photo_score">Photo Score ↓</SelectItem>
              <SelectItem value="magnitude">Magnitude ↑</SelectItem>
              <SelectItem value="size_max">Size ↓</SelectItem>
              <SelectItem value="catalog_id">Catalog ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters drawer trigger */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 relative">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Presets */}
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

              {/* Catalogs */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Catalogs</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "M", label: "M", fullLabel: "Messier" },
                    { key: "NGC", label: "NGC", fullLabel: "NGC" },
                    { key: "IC", label: "IC", fullLabel: "IC" },
                    { key: "SH", label: "Sh", fullLabel: "Sharpless" },
                    { key: "B", label: "B", fullLabel: "Barnard" },
                    { key: "ACO", label: "Abell", fullLabel: "Abell" },
                    { key: "C", label: "C", fullLabel: "Caldwell" },
                    { key: "OTHER", label: "Other", fullLabel: "Other" },
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
                            catalog: active ? "" : cat.key,
                            limitResults: undefined,
                          })
                        }
                        className={`text-xs h-7 px-2.5 ${active ? "bg-primary text-primary-foreground" : ""}`}
                      >
                        {active ? cat.fullLabel : cat.label}
                        {active && <X className="w-3 h-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Constellation */}
              <div className="space-y-1">
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

              {/* Size range — unified dual-handle */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Size: {filters.minSize > 0 ? `${filters.minSize}'` : "0'"} — {filters.maxSize < 300 ? `${filters.maxSize}'` : "Any"} (arcminutes)
                </label>
                <Slider
                  value={[filters.minSize, filters.maxSize]}
                  onValueChange={([min, max]) =>
                    onChange({ ...filters, minSize: min, maxSize: max })
                  }
                  min={0}
                  max={300}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Magnitude */}
              <div className="space-y-1">
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

              {/* Photo score */}
              <div className="space-y-1">
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
            </div>
          </SheetContent>
        </Sheet>

        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {totalCount.toLocaleString()} objects
        </div>
      </div>

      {/* Object type tag counters stay below */}
      {buckets.length > 0 && (() => {
        const countByType = new Map<string, number>();
        for (const r of typeCounts ?? []) countByType.set(r.obj_type, Number(r.n) || 0);
        const dynamicCount = (b: TypeBucket) =>
          typeCounts ? b.values.reduce((sum, v) => sum + (countByType.get(v) ?? 0), 0) : b.count;
        return (
          <div className="flex flex-wrap gap-1.5">
            {buckets.map((b) => {
              const active = b.values.some((v) => filters.objTypes.includes(v));
              const n = dynamicCount(b);
              const dimmed = typeCounts != null && n === 0 && !active;
              return (
                <Badge
                  key={b.label}
                  variant={active ? "default" : "secondary"}
                  className={`cursor-pointer text-[10px] px-2 py-0.5 transition-colors inline-flex items-center gap-1 ${dimmed ? "opacity-40" : ""}`}
                  onClick={() => toggleBucket(b)}
                >
                  <span>{b.label}</span>
                  <span className={`text-[9px] tabular-nums ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {n.toLocaleString()}
                  </span>
                  {active && <X className="w-3 h-3" />}
                </Badge>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default AtlasFilters;
