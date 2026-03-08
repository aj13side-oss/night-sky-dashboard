import { useState, useMemo } from "react";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Telescope, Camera, Filter, Anchor, X, Scale, Wrench, Sparkles } from "lucide-react";
import {
  useCameras, useTelescopes, useMounts, useFilters, useAccessories, useRigPresets, extractPrices,
  type AstroCamera, type AstroTelescope, type AstroMount, type AstroFilter, type AstroAccessory, type RigPreset,
} from "@/hooks/useEquipmentCatalog";
import { EquipmentCard } from "@/components/rigbuilder/EquipmentCard";
import { PresetCards } from "@/components/rigbuilder/PresetCards";
import { CompareTable } from "@/components/rigbuilder/CompareTable";
import { RangeFilter } from "@/components/rigbuilder/RangeFilter";
import { RigSummary } from "@/components/rigbuilder/RigSummary";
import { ChipFilter, ToggleFilter } from "@/components/rigbuilder/ChipFilter";
import { SearchSortBar } from "@/components/rigbuilder/SearchSortBar";
import { EquipmentTab } from "@/components/rigbuilder/EquipmentTab";

type Category = "telescopes" | "cameras" | "mounts" | "filters" | "accessories";

function bounds(arr: (number | null | undefined)[]): [number, number] {
  const nums = arr.filter((n): n is number => n != null && !isNaN(n));
  if (!nums.length) return [0, 100];
  return [Math.floor(Math.min(...nums)), Math.ceil(Math.max(...nums))];
}

function getBestPrice(item: { _raw?: Record<string, any> }): number | null {
  const { best } = extractPrices(item._raw ?? {});
  return best?.price ?? null;
}

function sortItems<T extends { brand: string; model: string; _raw?: Record<string, any> }>(
  items: T[], sortBy: string, extraSort?: (a: T, b: T, key: string) => number | null
): T[] {
  return [...items].sort((a, b) => {
    if (sortBy === "brand") return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
    if (sortBy === "name") return a.model.localeCompare(b.model);
    if (sortBy === "price_asc") return (getBestPrice(a) ?? Infinity) - (getBestPrice(b) ?? Infinity);
    if (sortBy === "price_desc") return (getBestPrice(b) ?? 0) - (getBestPrice(a) ?? 0);
    const extra = extraSort?.(a, b, sortBy);
    if (extra != null) return extra;
    return 0;
  });
}

// Sort options per tab
const sortOptions: Record<Category, { value: string; label: string }[]> = {
  telescopes: [
    { value: "brand", label: "Brand A→Z" }, { value: "name", label: "Name A→Z" },
    { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" },
    { value: "focal_asc", label: "Focal ↑" }, { value: "focal_desc", label: "Focal ↓" },
    { value: "aperture_asc", label: "Aperture ↑" }, { value: "weight_asc", label: "Weight ↑" },
  ],
  cameras: [
    { value: "brand", label: "Brand A→Z" }, { value: "name", label: "Name A→Z" },
    { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" },
    { value: "pixel_asc", label: "Pixel ↑" }, { value: "sensor_asc", label: "Sensor ↑" },
    { value: "qe_desc", label: "QE ↓" }, { value: "weight_asc", label: "Weight ↑" },
  ],
  mounts: [
    { value: "brand", label: "Brand A→Z" }, { value: "name", label: "Name A→Z" },
    { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" },
    { value: "payload_asc", label: "Payload ↑" }, { value: "payload_desc", label: "Payload ↓" },
    { value: "weight_asc", label: "Weight ↑" },
  ],
  filters: [
    { value: "brand", label: "Brand A→Z" }, { value: "name", label: "Name A→Z" },
    { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" },
  ],
  accessories: [
    { value: "brand", label: "Brand A→Z" }, { value: "name", label: "Name A→Z" },
    { value: "price_asc", label: "Price ↑" }, { value: "price_desc", label: "Price ↓" },
  ],
};

const RigBuilder = () => {
  const { data: cameras, isLoading: loadingCams } = useCameras();
  const { data: telescopes, isLoading: loadingScopes } = useTelescopes();
  const { data: mounts, isLoading: loadingMounts } = useMounts();
  const { data: filters, isLoading: loadingFilters } = useFilters();
  const { data: accessories, isLoading: loadingAccessories } = useAccessories();
  const { data: presets } = useRigPresets();
  const [presetsOpen, setPresetsOpen] = useState(true);

  const [tab, setTab] = useState<Category>("telescopes");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("brand");
  const [compareIds, setCompareIds] = useState<Record<Category, string[]>>({
    telescopes: [], cameras: [], mounts: [], filters: [], accessories: [],
  });

  const [rigPicks, setRigPicks] = useState<{
    telescope: string | null; camera: string | null; mount: string | null;
    filter: string | null; accessories: string[];
  }>({
    telescope: null, camera: null, mount: null, filter: null, accessories: [],
  });

  // --- Filter state ---
  const scopeBoundsFL = useMemo(() => bounds(telescopes?.map(t => t.focal_length_mm) ?? []), [telescopes]);
  const scopeBoundsAp = useMemo(() => bounds(telescopes?.map(t => t.aperture_mm) ?? []), [telescopes]);
  const [scopeFL, setScopeFL] = useState<[number, number] | null>(null);
  const [scopeAp, setScopeAp] = useState<[number, number] | null>(null);
  const [scopeType, setScopeType] = useState<string | null>(null);
  const [scopeBrand, setScopeBrand] = useState<string | null>(null);

  const camBoundsSW = useMemo(() => bounds(cameras?.map(c => c.sensor_width_mm) ?? []), [cameras]);
  const camBoundsPx = useMemo(() => bounds(cameras?.map(c => c.pixel_size_um) ?? []), [cameras]);
  const [camSW, setCamSW] = useState<[number, number] | null>(null);
  const [camPx, setCamPx] = useState<[number, number] | null>(null);
  const [camSensor, setCamSensor] = useState<string | null>(null);
  const [camColor, setCamColor] = useState<boolean | null>(null);
  const [camCooling, setCamCooling] = useState<boolean | null>(null);

  const mntBoundsPayload = useMemo(() => bounds(mounts?.map(m => m.payload_kg) ?? []), [mounts]);
  const mntBoundsWeight = useMemo(() => bounds(mounts?.map(m => m.mount_weight_kg) ?? []), [mounts]);
  const [mntPayload, setMntPayload] = useState<[number, number] | null>(null);
  const [mntWeight, setMntWeight] = useState<[number, number] | null>(null);
  const [mntType, setMntType] = useState<string | null>(null);
  const [mntGoto, setMntGoto] = useState<boolean | null>(null);
  const [mntBrand, setMntBrand] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [accType, setAccType] = useState<string | null>(null);

  // --- Unique values for chip filters ---
  const scopeTypes = useMemo(() => [...new Set(telescopes?.map(t => t.type).filter(Boolean) as string[])].sort(), [telescopes]);
  const scopeBrands = useMemo(() => [...new Set(telescopes?.map(t => t.brand).filter(Boolean) as string[])].sort(), [telescopes]);
  const camSensors = useMemo(() => {
    const counts: Record<string, number> = {};
    cameras?.forEach(c => { if (c.sensor_name) counts[c.sensor_name] = (counts[c.sensor_name] || 0) + 1; });
    return Object.entries(counts).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name} (${n})`);
  }, [cameras]);
  const mntTypes = useMemo(() => [...new Set(mounts?.map(m => m.mount_type).filter(Boolean) as string[])].sort(), [mounts]);
  const mntBrands = useMemo(() => [...new Set(mounts?.map(m => m.brand).filter(Boolean) as string[])].sort(), [mounts]);
  const filterTypes = useMemo(() => [...new Set(filters?.map(f => f.type).filter(Boolean) as string[])].sort(), [filters]);
  const filterSizes = useMemo(() => [...new Set(filters?.map(f => f.size).filter(Boolean) as string[])].sort(), [filters]);
  const accTypes = useMemo(() => [...new Set(accessories?.map(a => a.category).filter(Boolean) as string[])].sort(), [accessories]);

  const q = searchQuery.toLowerCase().trim();

  // --- Filtered & sorted data ---
  const filteredScopes = useMemo(() => {
    if (!telescopes) return [];
    const fl = scopeFL ?? scopeBoundsFL;
    const ap = scopeAp ?? scopeBoundsAp;
    const filtered = telescopes.filter(t => {
      if (q && !`${t.brand} ${t.model}`.toLowerCase().includes(q)) return false;
      if (t.focal_length_mm != null && (t.focal_length_mm < fl[0] || t.focal_length_mm > fl[1])) return false;
      if (t.aperture_mm != null && (t.aperture_mm < ap[0] || t.aperture_mm > ap[1])) return false;
      if (scopeType && t.type !== scopeType) return false;
      if (scopeBrand && t.brand !== scopeBrand) return false;
      return true;
    });
    return sortItems(filtered, sortBy, (a, b, key) => {
      if (key === "focal_asc") return (a.focal_length_mm ?? 0) - (b.focal_length_mm ?? 0);
      if (key === "focal_desc") return (b.focal_length_mm ?? 0) - (a.focal_length_mm ?? 0);
      if (key === "aperture_asc") return (a.aperture_mm ?? 0) - (b.aperture_mm ?? 0);
      if (key === "weight_asc") return (a.weight_kg ?? 999) - (b.weight_kg ?? 999);
      return null;
    });
  }, [telescopes, scopeFL, scopeAp, scopeBoundsFL, scopeBoundsAp, scopeType, scopeBrand, q, sortBy]);

  const filteredCams = useMemo(() => {
    if (!cameras) return [];
    const sw = camSW ?? camBoundsSW;
    const px = camPx ?? camBoundsPx;
    const filtered = cameras.filter(c => {
      if (q && !`${c.brand} ${c.model} ${c.sensor_name ?? ""}`.toLowerCase().includes(q)) return false;
      if (c.sensor_width_mm != null && (c.sensor_width_mm < sw[0] || c.sensor_width_mm > sw[1])) return false;
      if (c.pixel_size_um != null && (c.pixel_size_um < px[0] || c.pixel_size_um > px[1])) return false;
      if (camSensor && c.sensor_name !== camSensor) return false;
      if (camColor !== null && c.is_color !== camColor) return false;
      if (camCooling !== null) {
        const hasCooling = c.cooling_delta_c != null && c.cooling_delta_c > 0;
        if (camCooling !== hasCooling) return false;
      }
      return true;
    });
    return sortItems(filtered, sortBy, (a, b, key) => {
      if (key === "pixel_asc") return (a.pixel_size_um ?? 0) - (b.pixel_size_um ?? 0);
      if (key === "sensor_asc") return (a.sensor_width_mm ?? 0) - (b.sensor_width_mm ?? 0);
      if (key === "qe_desc") return (b.qe_percent ?? 0) - (a.qe_percent ?? 0);
      if (key === "weight_asc") return (a.weight_kg ?? 999) - (b.weight_kg ?? 999);
      return null;
    });
  }, [cameras, camSW, camPx, camBoundsSW, camBoundsPx, camSensor, camColor, camCooling, q, sortBy]);

  const filteredMounts = useMemo(() => {
    if (!mounts) return [];
    const pl = mntPayload ?? mntBoundsPayload;
    const wt = mntWeight ?? mntBoundsWeight;
    const filtered = mounts.filter(m => {
      if (q && !`${m.brand} ${m.model}`.toLowerCase().includes(q)) return false;
      if (m.payload_kg != null && (m.payload_kg < pl[0] || m.payload_kg > pl[1])) return false;
      if (m.mount_weight_kg != null && (m.mount_weight_kg < wt[0] || m.mount_weight_kg > wt[1])) return false;
      if (mntType && m.mount_type !== mntType) return false;
      if (mntGoto !== null && m.is_goto !== mntGoto) return false;
      if (mntBrand && m.brand !== mntBrand) return false;
      return true;
    });
    return sortItems(filtered, sortBy, (a, b, key) => {
      if (key === "payload_asc") return (a.payload_kg ?? 0) - (b.payload_kg ?? 0);
      if (key === "payload_desc") return (b.payload_kg ?? 0) - (a.payload_kg ?? 0);
      if (key === "weight_asc") return (a.mount_weight_kg ?? 999) - (b.mount_weight_kg ?? 999);
      return null;
    });
  }, [mounts, mntPayload, mntWeight, mntBoundsPayload, mntBoundsWeight, mntType, mntGoto, mntBrand, q, sortBy]);

  const filteredFilts = useMemo(() => {
    if (!filters) return [];
    const filtered = filters.filter(f => {
      if (q && !`${f.brand} ${f.model}`.toLowerCase().includes(q)) return false;
      if (filterType && f.type !== filterType) return false;
      if (filterSize && f.size !== filterSize) return false;
      return true;
    });
    return sortItems(filtered, sortBy);
  }, [filters, filterType, filterSize, q, sortBy]);

  const filteredAccessories = useMemo(() => {
    if (!accessories) return [];
    const filtered = accessories.filter(a => {
      if (q && !`${a.brand} ${a.model}`.toLowerCase().includes(q)) return false;
      if (accType && a.category !== accType) return false;
      return true;
    });
    return sortItems(filtered, sortBy);
  }, [accessories, accType, q, sortBy]);

  const toggleCompare = (cat: Category, id: string) => {
    setCompareIds(prev => {
      const list = prev[cat];
      return {
        ...prev,
        [cat]: list.includes(id) ? list.filter(i => i !== id) : list.length < 4 ? [...list, id] : list,
      };
    });
  };

  const loadPreset = (preset: RigPreset) => {
    setRigPicks({
      telescope: preset.telescope_id,
      camera: preset.camera_id,
      mount: preset.mount_id,
      filter: null,
      accessories: preset.accessory_ids ?? [],
    });
    setCompareIds({
      telescopes: preset.telescope_id ? [preset.telescope_id] : [],
      cameras: preset.camera_id ? [preset.camera_id] : [],
      mounts: preset.mount_id ? [preset.mount_id] : [],
      filters: [],
      accessories: preset.accessory_ids ?? [],
    });
    toast.success(`Configuration "${preset.name}" loaded`);
  };

  const clearCompare = (cat: Category) => setCompareIds(prev => ({ ...prev, [cat]: [] }));
  const compareCount = compareIds[tab].length;

  const pickedTelescope = telescopes?.find(t => t.id === rigPicks.telescope) ?? null;
  const pickedCamera = cameras?.find(c => c.id === rigPicks.camera) ?? null;
  const pickedMount = mounts?.find(m => m.id === rigPicks.mount) ?? null;
  const pickedFilter = filters?.find(f => f.id === rigPicks.filter) ?? null;
  const pickedAccessories = accessories?.filter(a => rigPicks.accessories.includes(a.id)) ?? [];

  const searchBar = (
    <SearchSortBar
      searchQuery={searchQuery} onSearchChange={setSearchQuery}
      sortBy={sortBy} onSortChange={setSortBy}
      sortOptions={sortOptions[tab]}
    />
  );

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Rig Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare astrophotography gear side-by-side. Select up to 4 items to compare, or pick one per category to see rig performance.
          </p>
        </motion.div>

        <RigSummary telescope={pickedTelescope} camera={pickedCamera} mount={pickedMount} filter={pickedFilter} accessories={pickedAccessories} />

        {presets && presets.length > 0 && (
          <div>
            <button
              onClick={() => setPresetsOpen(o => !o)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-2"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Recommended Configurations ({presets.length})
              <span className={`text-xs transition-transform ${presetsOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {presetsOpen && <PresetCards presets={presets} onLoad={loadPreset} />}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Category); setSearchQuery(""); setSortBy("brand"); }}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="telescopes" className="gap-1.5">
              <Telescope className="w-3.5 h-3.5" /> Optics
            </TabsTrigger>
            <TabsTrigger value="cameras" className="gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Cameras
            </TabsTrigger>
            <TabsTrigger value="mounts" className="gap-1.5">
              <Anchor className="w-3.5 h-3.5" /> Mounts
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters
            </TabsTrigger>
            <TabsTrigger value="accessories" className="gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Acc.
            </TabsTrigger>
          </TabsList>

          {/* Compare bar */}
          {compareCount > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <span className="text-sm font-medium text-foreground">{compareCount} selected</span>
              <Button size="sm" variant="outline" onClick={() => clearCompare(tab)} className="gap-1">
                <X className="w-3 h-3" /> Clear
              </Button>
            </motion.div>
          )}

          {/* ==================== TELESCOPES ==================== */}
          <TabsContent value="telescopes">
            <EquipmentTab loading={loadingScopes} searchBar={searchBar} resultCount={filteredScopes.length} searchQuery={searchQuery}
              filters={
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <RangeFilter label="Focal Length" unit="mm" min={scopeBoundsFL[0]} max={scopeBoundsFL[1]}
                      value={scopeFL ?? scopeBoundsFL} onChange={setScopeFL} step={10} />
                    <RangeFilter label="Aperture" unit="mm" min={scopeBoundsAp[0]} max={scopeBoundsAp[1]}
                      value={scopeAp ?? scopeBoundsAp} onChange={setScopeAp} step={5} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ChipFilter label="Type" options={scopeTypes} selected={scopeType} onChange={setScopeType} />
                    <ChipFilter label="Brand" options={scopeBrands} selected={scopeBrand} onChange={setScopeBrand} />
                  </div>
                </>
              }
              compareTable={compareIds.telescopes.length >= 2 ? (
                <CompareTable
                  items={telescopes?.filter(t => compareIds.telescopes.includes(t.id)) ?? []}
                  getImage={t => t.image_url}
                  columns={[
                    { label: "Focal Length", render: t => t.focal_length_mm ? `${t.focal_length_mm}mm` : "—" },
                    { label: "Aperture", render: t => t.aperture_mm ? `${t.aperture_mm}mm` : "—", bestDirection: "higher" },
                    { label: "f/D", render: t => t.focal_length_mm && t.aperture_mm ? `f/${(t.focal_length_mm / t.aperture_mm).toFixed(1)}` : "—", bestDirection: "lower" },
                    { label: "Type", render: t => t.type ?? "—" },
                    { label: "Weight", render: t => t.weight_kg ? `${t.weight_kg}kg` : "—", bestDirection: "lower" },
                    { label: "Image Circle", render: t => t.image_circle_mm ? `${t.image_circle_mm}mm` : "—", bestDirection: "higher" },
                    { label: "Backfocus", render: t => t.required_backfocus_mm ? `${t.required_backfocus_mm}mm` : "—" },
                  ]}
                  getName={t => `${t.brand} ${t.model}`}
                  getAffiliates={t => ({ amazon: t.url_amazon, astro: t.url_astroshop_de, manufacturer: t.url_manufacturer })}
                />
              ) : undefined}
            >
              {filteredScopes.map(t => {
                const { best } = extractPrices(t._raw ?? {});
                return (
                  <EquipmentCard key={t.id} selected={compareIds.telescopes.includes(t.id)}
                    onToggle={() => { toggleCompare("telescopes", t.id); setRigPicks(p => ({ ...p, telescope: p.telescope === t.id ? null : t.id })); }}
                    imageUrl={t.image_url} title={`${t.brand} ${t.model}`} bestPrice={best}
                    specs={[
                      t.focal_length_mm ? `${t.focal_length_mm}mm` : null,
                      t.aperture_mm ? `⌀${t.aperture_mm}mm` : null,
                      t.focal_length_mm && t.aperture_mm ? `f/${(t.focal_length_mm / t.aperture_mm).toFixed(1)}` : null,
                      t.type, t.weight_kg ? `${t.weight_kg}kg` : null,
                      t.image_circle_mm ? `IC ${t.image_circle_mm}mm` : null,
                    ]}
                    affiliateAmazon={t.url_amazon} affiliateAstro={t.url_astroshop_de} manufacturerUrl={t.url_manufacturer}
                  />
                );
              })}
            </EquipmentTab>
          </TabsContent>

          {/* ==================== CAMERAS ==================== */}
          <TabsContent value="cameras">
            <EquipmentTab loading={loadingCams} searchBar={searchBar} resultCount={filteredCams.length} searchQuery={searchQuery}
              filters={
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <RangeFilter label="Sensor Width" unit="mm" min={camBoundsSW[0]} max={camBoundsSW[1]}
                      value={camSW ?? camBoundsSW} onChange={setCamSW} step={0.5} />
                    <RangeFilter label="Pixel Size" unit="µm" min={camBoundsPx[0]} max={camBoundsPx[1]}
                      value={camPx ?? camBoundsPx} onChange={setCamPx} step={0.1} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <ChipFilter label="Sensor" options={camSensors} selected={camSensor ? camSensors.find(s => s.startsWith(camSensor)) ?? null : null} onChange={(v) => setCamSensor(v ? v.replace(/ \(\d+\)$/, "") : null)} />
                    <ToggleFilter label="Type" value={camColor} onChange={setCamColor} labelYes="Color" labelNo="Mono" />
                    <ToggleFilter label="Cooling" value={camCooling} onChange={setCamCooling} labelYes="Cooled" labelNo="Uncooled" />
                  </div>
                </>
              }
              compareTable={compareIds.cameras.length >= 2 ? (
                <CompareTable
                  items={cameras?.filter(c => compareIds.cameras.includes(c.id)) ?? []}
                  getImage={c => c.image_url}
                  columns={[
                    { label: "Sensor", render: c => c.sensor_name ?? "—" },
                    { label: "Size", render: c => c.sensor_width_mm && c.sensor_height_mm ? `${c.sensor_width_mm}×${c.sensor_height_mm}mm` : "—" },
                    { label: "Resolution", render: c => c.resolution_x && c.resolution_y ? `${c.resolution_x}×${c.resolution_y}` : "—" },
                    { label: "Pixel Size", render: c => c.pixel_size_um ? `${c.pixel_size_um}µm` : "—" },
                    { label: "Type", render: c => c.is_color !== null ? (c.is_color ? "Color (OSC)" : "Mono") : "—" },
                    { label: "QE", render: c => c.qe_percent ? `${c.qe_percent}%` : "—", bestDirection: "higher" },
                    { label: "Read Noise", render: c => c.read_noise_e ? `${c.read_noise_e}e⁻` : "—", bestDirection: "lower" },
                    { label: "Full Well", render: c => c.full_well_e ? `${c.full_well_e.toLocaleString()}e⁻` : "—", bestDirection: "higher" },
                    { label: "ADC", render: c => c.adc_bits ? `${c.adc_bits}-bit` : "—", bestDirection: "higher" },
                    { label: "Cooling", render: c => c.cooling_delta_c ? `ΔT ${c.cooling_delta_c}°C` : "—" },
                    { label: "Weight", render: c => c.weight_kg ? `${c.weight_kg.toFixed(2)}kg` : "—", bestDirection: "lower" },
                    { label: "Interface", render: c => c.interface_type ?? "—" },
                    { label: "Backfocus", render: c => c.internal_backfocus_mm ? `${c.internal_backfocus_mm}mm` : "—" },
                  ]}
                  getName={c => `${c.brand} ${c.model}`}
                  getAffiliates={c => ({ amazon: c.url_amazon, astro: c.url_astroshop_de, manufacturer: c.url_manufacturer })}
                />
              ) : undefined}
            >
              {filteredCams.map(c => {
                const { best } = extractPrices(c._raw ?? {});
                return (
                  <EquipmentCard key={c.id} selected={compareIds.cameras.includes(c.id)}
                    onToggle={() => { toggleCompare("cameras", c.id); setRigPicks(p => ({ ...p, camera: p.camera === c.id ? null : c.id })); }}
                    imageUrl={c.image_url} title={`${c.brand} ${c.model}`} bestPrice={best}
                    specs={[
                      c.sensor_width_mm && c.sensor_height_mm ? `${c.sensor_width_mm}×${c.sensor_height_mm}mm` : null,
                      c.pixel_size_um ? `${c.pixel_size_um}µm` : null,
                      c.sensor_name, c.is_color !== null ? (c.is_color ? "Color" : "Mono") : null,
                      c.qe_percent ? `QE ${c.qe_percent}%` : null,
                      c.read_noise_e ? `${c.read_noise_e}e⁻` : null,
                    ]}
                    affiliateAmazon={c.url_amazon} affiliateAstro={c.url_astroshop_de} manufacturerUrl={c.url_manufacturer}
                  />
                );
              })}
            </EquipmentTab>
          </TabsContent>

          {/* ==================== MOUNTS ==================== */}
          <TabsContent value="mounts">
            <EquipmentTab loading={loadingMounts} searchBar={searchBar} resultCount={filteredMounts.length} searchQuery={searchQuery}
              filters={
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <RangeFilter label="Payload" unit="kg" min={mntBoundsPayload[0]} max={mntBoundsPayload[1]}
                      value={mntPayload ?? mntBoundsPayload} onChange={setMntPayload} step={1} />
                    <RangeFilter label="Mount Weight" unit="kg" min={mntBoundsWeight[0]} max={mntBoundsWeight[1]}
                      value={mntWeight ?? mntBoundsWeight} onChange={setMntWeight} step={0.5} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <ChipFilter label="Type" options={mntTypes} selected={mntType} onChange={setMntType} />
                    <ToggleFilter label="GoTo" value={mntGoto} onChange={setMntGoto} />
                    <ChipFilter label="Brand" options={mntBrands} selected={mntBrand} onChange={setMntBrand} />
                  </div>
                </>
              }
              compareTable={compareIds.mounts.length >= 2 ? (
                <CompareTable
                  items={mounts?.filter(m => compareIds.mounts.includes(m.id)) ?? []}
                  getImage={m => m.image_url}
                  columns={[
                    { label: "Payload", render: m => m.payload_kg ? `${m.payload_kg}kg` : "—", bestDirection: "higher" },
                    { label: "Weight", render: m => m.mount_weight_kg ? `${m.mount_weight_kg}kg` : "—", bestDirection: "lower" },
                    { label: "Type", render: m => m.mount_type ?? "—" },
                    { label: "GoTo", render: m => m.is_goto != null ? (m.is_goto ? "Yes" : "No") : "—" },
                    { label: "Periodic Error", render: m => m.periodic_error_arcsec ? `±${m.periodic_error_arcsec}″` : "—", bestDirection: "lower" },
                    { label: "Connectivity", render: m => m.connectivity ?? "—" },
                    { label: "ASCOM/INDI", render: m => m.ascom_indi ?? "—" },
                  ]}
                  getName={m => `${m.brand} ${m.model}`}
                  getAffiliates={m => ({ amazon: m.url_amazon, astro: m.url_astroshop_de, manufacturer: m.url_manufacturer })}
                />
              ) : undefined}
            >
              {filteredMounts.map(m => {
                const { best } = extractPrices(m._raw ?? {});
                return (
                  <EquipmentCard key={m.id} selected={compareIds.mounts.includes(m.id)}
                    onToggle={() => { toggleCompare("mounts", m.id); setRigPicks(p => ({ ...p, mount: p.mount === m.id ? null : m.id })); }}
                    imageUrl={m.image_url} title={`${m.brand} ${m.model}`} bestPrice={best}
                    specs={[
                      m.payload_kg ? `Payload: ${m.payload_kg}kg` : null,
                      m.mount_weight_kg ? `Weight: ${m.mount_weight_kg}kg` : null,
                      m.mount_type, m.is_goto ? "GoTo" : null,
                      m.periodic_error_arcsec ? `PE ±${m.periodic_error_arcsec}″` : null,
                      m.connectivity,
                    ]}
                    affiliateAmazon={m.url_amazon} affiliateAstro={m.url_astroshop_de} manufacturerUrl={m.url_manufacturer}
                  />
                );
              })}
            </EquipmentTab>
          </TabsContent>

          {/* ==================== FILTERS ==================== */}
          <TabsContent value="filters">
            <EquipmentTab loading={loadingFilters} searchBar={searchBar} resultCount={filteredFilts.length} searchQuery={searchQuery}
              filters={
                <div className="grid sm:grid-cols-2 gap-4">
                  <ChipFilter label="Type" options={filterTypes} selected={filterType} onChange={setFilterType} />
                  <ChipFilter label="Size" options={filterSizes} selected={filterSize} onChange={setFilterSize} />
                </div>
              }
              compareTable={compareIds.filters.length >= 2 ? (
                <CompareTable
                  items={filters?.filter(f => compareIds.filters.includes(f.id)) ?? []}
                  getImage={f => f.image_url}
                  columns={[
                    { label: "Type", render: f => f.type ?? "—" },
                    { label: "Size", render: f => f.size ?? "—" },
                    { label: "Thickness", render: f => f.thickness_mm ? `${f.thickness_mm}mm` : "—" },
                  ]}
                  getName={f => `${f.brand} ${f.model}`}
                  getAffiliates={f => ({ amazon: f.url_amazon, astro: f.url_astroshop_de, manufacturer: f.url_manufacturer })}
                />
              ) : undefined}
            >
              {filteredFilts.map(f => {
                const { best } = extractPrices(f._raw ?? {});
                return (
                  <EquipmentCard key={f.id} selected={compareIds.filters.includes(f.id)}
                    onToggle={() => { toggleCompare("filters", f.id); setRigPicks(p => ({ ...p, filter: p.filter === f.id ? null : f.id })); }}
                    imageUrl={f.image_url} title={`${f.brand} ${f.model}`} bestPrice={best}
                    specs={[f.type, f.size, f.thickness_mm ? `${f.thickness_mm}mm thick` : null]}
                    affiliateAmazon={f.url_amazon} affiliateAstro={f.url_astroshop_de} manufacturerUrl={f.url_manufacturer}
                  />
                );
              })}
            </EquipmentTab>
          </TabsContent>

          {/* ==================== ACCESSORIES ==================== */}
          <TabsContent value="accessories">
            <EquipmentTab loading={loadingAccessories} searchBar={searchBar} resultCount={filteredAccessories.length} searchQuery={searchQuery}
              filters={
                <ChipFilter label="Category" options={accTypes} selected={accType} onChange={setAccType} />
              }
              compareTable={compareIds.accessories.length >= 2 ? (
                <CompareTable
                  items={accessories?.filter(a => compareIds.accessories.includes(a.id)) ?? []}
                  getImage={a => a.image_url}
                  columns={[
                    { label: "Category", render: a => a.category ?? "—" },
                    { label: "Backfocus", render: a => a.optical_length_mm ? `${a.optical_length_mm}mm` : "—" },
                    { label: "Weight", render: a => a.weight_g ? `${a.weight_g}g` : "—", bestDirection: "lower" },
                    { label: "Input", render: a => a.input_connection ?? "—" },
                    { label: "Output", render: a => a.output_connection ?? "—" },
                  ]}
                  getName={a => `${a.brand} ${a.model}`}
                  getAffiliates={a => ({ amazon: a.url_amazon, astro: a.url_astroshop_de, manufacturer: a.url_manufacturer })}
                />
              ) : undefined}
            >
              {filteredAccessories.map(a => {
                const { best } = extractPrices(a._raw ?? {});
                const isInRig = rigPicks.accessories.includes(a.id);
                return (
                  <EquipmentCard key={a.id} selected={compareIds.accessories.includes(a.id)}
                    onToggle={() => {
                      toggleCompare("accessories", a.id);
                      setRigPicks(p => ({
                        ...p,
                        accessories: isInRig ? p.accessories.filter(id => id !== a.id) : [...p.accessories, a.id],
                      }));
                    }}
                    imageUrl={a.image_url} title={`${a.brand} ${a.model}`} bestPrice={best}
                    specs={[
                      a.category, a.optical_length_mm ? `BF +${a.optical_length_mm}mm` : null,
                      a.weight_g ? `${a.weight_g}g` : null,
                      a.input_connection ? `In: ${a.input_connection}` : null,
                      a.output_connection ? `Out: ${a.output_connection}` : null,
                    ]}
                    affiliateAmazon={a.url_amazon} affiliateAstro={a.url_astroshop_de} manufacturerUrl={a.url_manufacturer}
                  />
                );
              })}
            </EquipmentTab>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RigBuilder;
