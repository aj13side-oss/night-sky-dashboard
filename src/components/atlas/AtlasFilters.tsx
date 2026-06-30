import { CelestialFilters, TypeBucket, CatalogTypeCount } from "@/hooks/useCelestialObjects";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Trophy, Star, Moon, Camera, SlidersHorizontal, ArrowUpDown, ChevronDown, Sparkles, Orbit } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface NightWindow {
  startMs: number;
  endMs: number;
  minMs: number;
  maxMs: number;
  activePreset: "astro" | "nautical" | "civil" | "custom";
  presetAvail: { astro: boolean; nautical: boolean; civil: boolean };
  presetTimes: {
    astro: { startMs: number; endMs: number } | null;
    nautical: { startMs: number; endMs: number } | null;
    civil: { startMs: number; endMs: number } | null;
  };
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

const NEBULA_TYPES = [
  "Emission Nebula",
  "Reflection Nebula",
  "Planetary Nebula",
  "Dark Nebula",
  "Cluster + Nebula",
];
const GALAXY_TYPES = ["Galaxy", "Cluster of Galaxies"];

type Top50Mode = "essentials" | "nebulas" | "galaxies" | null;

const arraysEqualAsSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const top50Mode: Top50Mode = useMemo(() => {
    if (filters.limitResults !== 50) return null;
    if (filters.objTypes.length === 0) return "essentials";
    if (arraysEqualAsSet(filters.objTypes, NEBULA_TYPES)) return "nebulas";
    if (arraysEqualAsSet(filters.objTypes, GALAXY_TYPES)) return "galaxies";
    return "essentials";
  }, [filters.limitResults, filters.objTypes]);

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

  const applyTop50 = (mode: Exclude<Top50Mode, null>) => {
    if (top50Mode === mode) {
      onChange({ ...filters, limitResults: undefined, objTypes: [] });
      return;
    }
    const objTypes =
      mode === "nebulas" ? [...NEBULA_TYPES] : mode === "galaxies" ? [...GALAXY_TYPES] : [];
    onChange({
      ...filters,
      sortBy: "photo_score",
      limitResults: 50,
      objTypes,
      search: "",
      constellation: "",
      catalog: "",
      maxMagnitude: 20,
      minPhotoScore: 0,
      minSize: 0,
      maxSize: 300,
    });
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.catalog) n++;
    if (filters.constellation) n++;
    if (filters.minSize > 0 || filters.maxSize < 300) n++;
    if (filters.maxMagnitude < 20) n++;
    if (filters.minPhotoScore > 0) n++;
    if (filterMode && filterMode !== "all") n++;
    return n;
  }, [filters, filterMode]);

  const nightDisabled = !visibleTonightEnabled;

  const top50Buttons: { key: Exclude<Top50Mode, null>; label: string; icon: JSX.Element }[] = [
    { key: "essentials", label: "Top 50 Essentials", icon: <Trophy className="w-3.5 h-3.5" /> },
    { key: "nebulas", label: "Top 50 Nebulas", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: "galaxies", label: "Top 50 Galaxies", icon: <Orbit className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Top preset row, above the frame */}
      <div className="flex flex-wrap gap-2">
        {top50Buttons.map((b) => {
          const active = top50Mode === b.key;
          return (
            <Button
              key={b.key}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => applyTop50(b.key)}
              className={`gap-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : ""}`}
            >
              {b.icon}
              {b.label}
              {active && <X className="w-3 h-3 ml-1" />}
            </Button>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        {/* Line 1: search | Advanced Filters + Sort */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search NGC, IC, Messier, name..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value, limitResults: undefined })}
              className="pl-10 bg-secondary/50 border-border/30 h-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="gap-1.5 text-xs h-9 relative"
            aria-expanded={advancedOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </Button>

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
                <SelectItem value="photo_score">Accessibility Score ↓</SelectItem>
                <SelectItem value="magnitude">Magnitude ↑</SelectItem>
                <SelectItem value="size_max">Size ↓</SelectItem>
                <SelectItem value="catalog_id">Catalog ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
            {totalCount.toLocaleString()} objects
          </div>
        </div>

        {/* Line 2: Visible Tonight + presets + slider */}
        <div className="flex flex-wrap gap-2 items-center">
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

          {nightWindow && (() => {
            const fmt = nightWindow.formatMs;
            const presetLabel = (k: "astro" | "nautical" | "civil") =>
              k === "astro" ? "Astro" : k === "nautical" ? "Nautical" : "Civil";
            const triggerText = (() => {
              if (nightWindow.activePreset === "custom") {
                return `Custom ${fmt(nightWindow.startMs)} – ${fmt(nightWindow.endMs)}`;
              }
              const t = nightWindow.presetTimes[nightWindow.activePreset];
              return t
                ? `${presetLabel(nightWindow.activePreset)} ${fmt(t.startMs)} – ${fmt(t.endMs)}`
                : presetLabel(nightWindow.activePreset);
            })();

            // Hour ticks (round hours) between minMs and maxMs.
            const ticks: { ms: number; pct: number; label: string }[] = [];
            const targetHours = [21, 0, 3, 6];
            const span = nightWindow.maxMs - nightWindow.minMs;
            if (span > 0) {
              const startDate = new Date(nightWindow.minMs);
              // Walk hour by hour from the hour AFTER minMs to before maxMs.
              const startHourMark = new Date(startDate);
              startHourMark.setMinutes(0, 0, 0);
              if (startHourMark.getTime() <= nightWindow.minMs) {
                startHourMark.setHours(startHourMark.getHours() + 1);
              }
              for (let t = startHourMark.getTime(); t <= nightWindow.maxMs; t += 3600_000) {
                const d = new Date(t);
                const h = d.getHours();
                if (!targetHours.includes(h)) continue;
                const pct = ((t - nightWindow.minMs) / span) * 100;
                ticks.push({
                  ms: t,
                  pct,
                  label: `${String(h).padStart(2, "0")}:00`,
                });
              }
            }

            return (
              <div
                className={`flex items-center gap-2 flex-1 min-w-[280px] ${nightDisabled ? "opacity-50 pointer-events-none select-none" : ""}`}
                aria-disabled={nightDisabled}
              >
                <Select
                  value={nightWindow.activePreset}
                  onValueChange={(v) => {
                    if (v === "custom") return;
                    nightWindow.onPresetSelect(v as "astro" | "nautical" | "civil");
                  }}
                  disabled={nightDisabled}
                >
                  <SelectTrigger className="bg-secondary/50 border-primary/30 h-8 text-xs w-[200px] text-primary">
                    <SelectValue>{triggerText}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["civil", "nautical", "astro"] as const).map((k) => {
                      const t = nightWindow.presetTimes[k];
                      const avail = nightWindow.presetAvail[k];
                      return (
                        <SelectItem key={k} value={k} disabled={!avail}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{presetLabel(k)}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {avail && t ? `${fmt(t.startMs)} – ${fmt(t.endMs)}` : "unavailable"}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                    {nightWindow.activePreset === "custom" && (
                      <SelectItem value="custom" disabled>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">Custom</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {fmt(nightWindow.startMs)} – {fmt(nightWindow.endMs)}
                          </span>
                        </span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <div className="flex-1 min-w-[140px]">
                  <Slider
                    value={[nightWindow.startMs, nightWindow.endMs]}
                    onValueChange={([s, e]) => nightWindow.onWindowChange(s, e)}
                    min={nightWindow.minMs}
                    max={nightWindow.maxMs}
                    step={5 * 60 * 1000}
                    disabled={nightDisabled}
                    className="w-full"
                  />
                  {ticks.length > 0 && (
                    <div className="relative h-4 mt-1">
                      {ticks.map((t) => (
                        <div
                          key={t.ms}
                          className="absolute top-0 flex flex-col items-center"
                          style={{ left: `${t.pct}%`, transform: "translateX(-50%)" }}
                        >
                          <div className="w-px h-1.5 bg-muted-foreground/40" />
                          <span className="text-[9px] text-muted-foreground/70 tabular-nums leading-none mt-0.5">
                            {t.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Line 3: object-type category tags */}
        {buckets.length > 0 && (() => {
          const countByType = new Map<string, number>();
          for (const r of typeCounts ?? []) countByType.set(r.obj_type, Number(r.n) || 0);
          const dynamicCount = (b: TypeBucket) => {
            if (!filters.catalog && b.values.every((v) => filters.excludeTypes.includes(v))) return 0;
            return typeCounts ? b.values.reduce((sum, v) => sum + (countByType.get(v) ?? 0), 0) : b.count;
          };
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

      {/* Advanced Filters in-page collapsible panel */}
      {advancedOpen && (
        <div className="glass-card rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Advanced Filters
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedOpen(false)}
              className="h-7 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Catalogs */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catalog</label>
            <div className="flex flex-wrap gap-1.5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Constellation */}
            <div className="space-y-1.5">
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

            {/* Imaging mode */}
            {onFilterModeChange && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Imaging mode</label>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            )}

            {/* Size range */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3 text-primary" />
                Min Accessibility Score: {filters.minPhotoScore > 0 ? filters.minPhotoScore : "All"}
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
        </div>
      )}
    </div>
  );
};

export default AtlasFilters;
