import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLocalizedPath } from "@/lib/localized-nav";
import { useTranslation, Trans } from "react-i18next";

import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import AtlasFilters from "@/components/atlas/AtlasFilters";
import ObjectCard from "@/components/atlas/ObjectCard";
import ObjectDetailModal from "@/components/atlas/ObjectDetailModal";
import {
  useCelestialObjects,
  useDistinctFilters,
  useCatalogTypeCounts,
  fetchCatalogObjectIds,
  CelestialFilters,
  CelestialObject,
  PAGE_SIZE,
} from "@/hooks/useCelestialObjects";
import { getAstroTwilightWindow } from "@/lib/astronomy";
import { calculateAltitude } from "@/lib/visibility";
import { useAstronomyData } from "@/hooks/useAstronomyData";
import { useObservation } from "@/contexts/ObservationContext";
import { utcToLocal } from "@/lib/timezone";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, ChevronDown, Telescope, MapPin, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SolarSystemObject } from "@/hooks/useSolarSystemObjects";

import TonightTopPicks from "@/components/atlas/TonightTopPicks";
import { useTopPhotoTargets } from "@/hooks/useTopPhotoTargets";

type PresetKey = "astro" | "nautical" | "civil" | "custom";

/** Anchor a local HH:MM string to today (>=12:00) or tomorrow (<12:00). */
function hhmmToDateTonight(hhmm: string, baseDate: Date): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  if (h >= 12) {
    d.setHours(h, m, 0, 0);
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

const DEFAULT_EXCLUDE_TYPES = ["Star", "Double Star"];

const defaultFilters: CelestialFilters = {
  search: "",
  objTypes: [],
  excludeTypes: DEFAULT_EXCLUDE_TYPES,
  constellation: "",
  maxMagnitude: 20,
  minPhotoScore: 0,
  sortBy: "photo_score",
  minSize: 0,
  maxSize: 300,
  catalog: "",
};

const SkyAtlas = () => {
  const { t: tAtlas } = useTranslation("atlas");
  const lp = useLocalizedPath();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<CelestialFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [allLoadedData, setAllLoadedData] = useState<CelestialObject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<CelestialObject | null>(null);
  const [userPos, setUserPos] = useState({ lat: 45.7347, lng: 4.4931 });
  const [geoStatus, setGeoStatus] = useState<'default' | 'requesting' | 'granted' | 'denied'>('default');
  const [visibleTonight, setVisibleTonight] = useState(true);
  const [filterMode, setFilterMode] = useState("all");
  const [windowStart, setWindowStart] = useState<Date | null>(null);
  const [windowEnd, setWindowEnd] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey>("civil");
  const prevVisibleTonightRef = useRef(visibleTonight);
  const [clientPage, setClientPage] = useState(0);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  const CLIENT_PAGE_SIZE = 20;
  

  const [equipment, setEquipment] = useState({
    focalLength: 0,
    sensorWidth: 0,
    sensorHeight: 0,
  });

  const { types, typeBuckets, constellations } = useDistinctFilters();
  const { data, isLoading } = useCelestialObjects(filters, page);
  const { data: typeCounts } = useCatalogTypeCounts(filters);
  const { data: topPickIds } = useTopPhotoTargets();
  const { data: astronomy } = useAstronomyData();
  const { location } = useObservation();

  const isClientFiltered = visibleTonight || filterMode !== "all";

  // Compute tonight's twilight presets (preset window endpoints as absolute Dates).
  const presets = useMemo(() => {
    const today = new Date();
    const tz = location.timezone;
    const sun = astronomy?.sun;
    const astroFallback = getAstroTwilightWindow(today, userPos.lat, userPos.lng);

    const fromUtcPair = (utcEnd: string | null, utcBegin: string | null) => {
      if (!utcEnd || !utcBegin) return null;
      const localEnd = utcToLocal(utcEnd, today, tz);
      const localBegin = utcToLocal(utcBegin, today, tz);
      if (!/^\d{2}:\d{2}$/.test(localEnd) || !/^\d{2}:\d{2}$/.test(localBegin)) return null;
      return {
        start: hhmmToDateTonight(localEnd, today),
        end: hhmmToDateTonight(localBegin, today),
      };
    };

    const astroFromApi = fromUtcPair(sun?.astronomicalTwilightEnd ?? null, sun?.astronomicalTwilightBegin ?? null);
    const nauticalFromApi = fromUtcPair(sun?.nauticalTwilightEnd ?? null, sun?.nauticalTwilightBegin ?? null);
    const civilFromApi = fromUtcPair(sun?.civilTwilightEnd ?? null, sun?.civilTwilightBegin ?? null);

    const astro = astroFromApi
      ?? (astroFallback.hasTrueNight && astroFallback.start && astroFallback.end
        ? { start: astroFallback.start, end: astroFallback.end }
        : null);

    // Sunset / sunrise as slider bounds
    let bounds: { start: Date; end: Date } | null = null;
    if (sun?.sunset && sun?.sunrise) {
      const ls = utcToLocal(sun.sunset, today, tz);
      const lr = utcToLocal(sun.sunrise, today, tz);
      if (/^\d{2}:\d{2}$/.test(ls) && /^\d{2}:\d{2}$/.test(lr)) {
        bounds = { start: hhmmToDateTonight(ls, today), end: hhmmToDateTonight(lr, today) };
      }
    }
    if (!bounds) {
      const s = new Date(today); s.setHours(18, 0, 0, 0);
      const e = new Date(today); e.setDate(e.getDate() + 1); e.setHours(6, 0, 0, 0);
      bounds = { start: s, end: e };
    }

    return {
      astro,
      nautical: nauticalFromApi,
      civil: civilFromApi,
      bounds,
      hasTrueNight: astro != null,
    };
  }, [astronomy, location.timezone, userPos.lat, userPos.lng]);


  // Larger working set fetched when a client-side filter is active, so the
  // visibility computation can evaluate the whole catalog, not just page 0.
  const LARGE_SET_LIMIT = 1500;
  const { data: largeSet, isLoading: largeSetLoading } = useQuery({
    queryKey: [
      "celestial-large-set",
      filters.objTypes,
      filters.excludeTypes,
      filters.constellation,
      filters.maxMagnitude,
      filters.minPhotoScore,
      filters.minSize,
      filters.maxSize,
      filters.search,
      filters.catalog,
    ],
    enabled: isClientFiltered && !filters.search.trim(),
    staleTime: 60_000,
    queryFn: async () => {
      let catalogIds: string[] | null = null;
      if (filters.catalog) {
        catalogIds = await fetchCatalogObjectIds(filters.catalog);
        if (catalogIds.length === 0) return [] as CelestialObject[];
      }
      let q = (supabase as any)
        .from("celestial_objects")
        .select("*")
        .order("photo_score", { ascending: false, nullsFirst: false })
        .limit(LARGE_SET_LIMIT);
      if (filters.objTypes.length > 0) {
        q = q.in("obj_type", filters.objTypes);
      } else if (!filters.catalog && filters.excludeTypes.length > 0) {
        for (const t of filters.excludeTypes) q = q.neq("obj_type", t);
      }
      if (catalogIds) q = q.in("id", catalogIds);
      if (filters.constellation) q = q.eq("constellation", filters.constellation);
      if (filters.maxMagnitude < 20) q = q.lte("magnitude", filters.maxMagnitude);
      if (filters.minPhotoScore > 0) q = q.gte("photo_score", filters.minPhotoScore);
      if (filters.minSize > 0) q = q.gte("size_max", filters.minSize);
      if (filters.maxSize < 300) q = q.lte("size_max", filters.maxSize);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CelestialObject[];
    },
  });

  // Accumulate data across pages for load-more
  useEffect(() => {
    if (!data?.data) return;
    if (page === 0) {
      setAllLoadedData(data.data);
    } else {
      setAllLoadedData(prev => {
        const existingIds = new Set(prev.map(o => o.id));
        const newItems = data.data.filter(o => !existingIds.has(o.id));
        return [...prev, ...newItems];
      });
    }
    setTotalCount(data.count ?? 0);
  }, [data, page]);

  // Rehydrate server-mode list when filters change emptied allLoadedData but the
  // current query already has data (e.g. turning off Visible Tonight).
  useEffect(() => {
    if (isClientFiltered) return;
    if (allLoadedData.length > 0) return;
    if (!data?.data || data.data.length === 0) return;
    setAllLoadedData(data.data);
    setTotalCount(data.count ?? 0);
  }, [isClientFiltered, allLoadedData.length, data]);

  // Solar system search
  const { data: solarResults = [] } = useQuery({
    queryKey: ["solar-atlas-search", filters.search],
    queryFn: async () => {
      if (!filters.search || filters.search.length < 2) return [];
      const { data } = await (supabase as any)
        .from("solar_system_objects")
        .select("*")
        .eq("is_active", true)
        .or(`name.ilike.%${filters.search}%,search_aliases.ilike.%${filters.search}%`);
      return (data ?? []) as SolarSystemObject[];
    },
    enabled: filters.search.length >= 2,
  });

  useEffect(() => {
    const minSizeParam = searchParams.get("minSize");
    const maxSizeParam = searchParams.get("maxSize");
    if (minSizeParam || maxSizeParam) {
      setFilters(prev => ({
        ...prev,
        minSize: minSizeParam ? Math.round(Number(minSizeParam)) : prev.minSize,
        maxSize: maxSizeParam ? Math.round(Number(maxSizeParam)) : prev.maxSize,
      }));
      setVisibleTonight(true);
    }
  }, []);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('granted');
      },
      () => {
        setUserPos({ lat: 45.7347, lng: 4.4931 });
        setGeoStatus('denied');
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    handleGeolocation();
  }, [handleGeolocation]);

  // Only reset the server-paginated accumulated list when server-query inputs change.
  useEffect(() => { setPage(0); setAllLoadedData([]); }, [filters]);
  // Client-side pagination resets when client filters/time window change.
  useEffect(() => { setClientPage(0); }, [visibleTonight, filterMode, windowStart, windowEnd]);

  // Client-side filters: visible tonight + filter mode
  const sourceData = useMemo<CelestialObject[]>(() => {
    if (isClientFiltered && largeSet && largeSet.length > 0) return largeSet;
    return allLoadedData;
  }, [isClientFiltered, largeSet, allLoadedData]);

  const filteredData = useMemo(() => {
    if (!sourceData.length) return [];
    let results: (CelestialObject & { _maxAltInWindow?: number; _hoursVisibleInWindow?: number })[] = sourceData;

    if (visibleTonight && windowStart && windowEnd && windowEnd.getTime() > windowStart.getTime()) {
      const startMs = windowStart.getTime();
      const endMs = windowEnd.getTime();
      const STEP_MS = 5 * 60 * 1000;
      results = results
        .map((obj) => {
          if (obj.ra_deg == null || obj.dec_deg == null) return null;
          let maxAlt = -90;
          let stepsAbove = 0;
          let aboveHorizon = false;
          for (let t = startMs; t <= endMs; t += STEP_MS) {
            const alt = calculateAltitude(obj.ra_deg, obj.dec_deg, userPos.lat, userPos.lng, new Date(t));
            if (alt > maxAlt) maxAlt = alt;
            if (alt > 0) { aboveHorizon = true; stepsAbove++; }
          }
          if (!aboveHorizon) return null;
          return { ...obj, _maxAltInWindow: maxAlt, _hoursVisibleInWindow: (stepsAbove * 5) / 60 };
        })
        .filter((obj): obj is NonNullable<typeof obj> => obj !== null);
    }

    if (filterMode === "rgb") {
      results = results.filter((obj) => {
        const f = obj.recommended_filter?.toLowerCase() ?? "";
        return !f || f.includes("l-pro") || f.includes("uv") || f.includes("ir") || f.includes("broadband");
      });
    } else if (filterMode === "narrowband") {
      results = results.filter((obj) => {
        const f = obj.recommended_filter?.toLowerCase() ?? "";
        return f.includes("ha") || f.includes("oiii") || f.includes("sii") || f.includes("narrowband") || f.includes("dual");
      });
    }

    // When a search term is active, the server has already returned relevance-
    // ranked results; skip client-side re-sorting to keep the exact match first.
    if (!filters.search.trim()) {
      if (visibleTonight && filters.sortBy === "tonight_duration") {
        results = [...results].sort(
          (a, b) => (b._hoursVisibleInWindow ?? 0) - (a._hoursVisibleInWindow ?? 0),
        );
      } else if (filters.sortBy === "magnitude") {
        results = [...results].sort(
          (a, b) => (a.magnitude ?? Infinity) - (b.magnitude ?? Infinity),
        );
      } else if (filters.sortBy === "size_max") {
        results = [...results].sort(
          (a, b) => (b.size_max ?? -Infinity) - (a.size_max ?? -Infinity),
        );
      } else if (filters.sortBy === "photo_score") {
        results = [...results].sort(
          (a, b) => (b.photo_score ?? -Infinity) - (a.photo_score ?? -Infinity),
        );
      } else if (filters.sortBy === "catalog_id") {
        results = [...results].sort((a, b) =>
          (a.catalog_id || "").localeCompare(b.catalog_id || "", undefined, { numeric: true }),
        );
      }
    }

    // Cap to limitResults (e.g. Top 50) on the client path so it applies even
    // when Visible Tonight is on (server-side limit is bypassed via largeSet).
    if (filters.limitResults && results.length > filters.limitResults) {
      results = results.slice(0, filters.limitResults);
    }

    return results;
  }, [sourceData, visibleTonight, filterMode, userPos.lat, userPos.lng, windowStart, windowEnd, filters.search, filters.sortBy, filters.limitResults]);

  // Initialize / re-sync window when Visible Tonight is enabled or presets become available.
  // When Visible Tonight transitions off->on, reset to civil preset by default.
  useEffect(() => {
    if (!visibleTonight) {
      prevVisibleTonightRef.current = visibleTonight;
      return;
    }

    const justTurnedOn = prevVisibleTonightRef.current === false;

    const pickFallback = () => {
      if (presets.civil) return { key: "civil" as const, p: presets.civil };
      if (presets.nautical) return { key: "nautical" as const, p: presets.nautical };
      if (presets.astro) return { key: "astro" as const, p: presets.astro };
      return { key: "custom" as const, p: presets.bounds };
    };

    if (justTurnedOn) {
      const { key, p } = pickFallback();
      setWindowStart(p.start);
      setWindowEnd(p.end);
      setActivePreset(key);
      prevVisibleTonightRef.current = visibleTonight;
      return;
    }

    if (activePreset === "custom") {
      if (!windowStart || !windowEnd) {
        const { key, p } = pickFallback();
        setWindowStart(p.start);
        setWindowEnd(p.end);
        setActivePreset(key);
      }
      prevVisibleTonightRef.current = visibleTonight;
      return;
    }

    const current = presets[activePreset];
    if (current) {
      if (
        !windowStart || !windowEnd ||
        windowStart.getTime() !== current.start.getTime() ||
        windowEnd.getTime() !== current.end.getTime()
      ) {
        setWindowStart(current.start);
        setWindowEnd(current.end);
      }
    } else {
      const { key, p } = pickFallback();
      setWindowStart(p.start);
      setWindowEnd(p.end);
      setActivePreset(key);
    }

    prevVisibleTonightRef.current = visibleTonight;
  }, [visibleTonight, presets, activePreset, windowStart, windowEnd]);

  const selectPreset = useCallback((key: "astro" | "nautical" | "civil") => {
    const p = presets[key];
    if (!p) return;
    setWindowStart(p.start);
    setWindowEnd(p.end);
    setActivePreset(key);
  }, [presets]);

  const showNoAstroNote = visibleTonight && activePreset === "astro" && !presets.astro;


  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const isTop50 = filters.limitResults === 50;
  const useClientCounts = isClientFiltered || isTop50;
  const displayedTotal = useClientCounts ? filteredData.length : totalCount;

  const clientTypeCounts = useMemo(() => {
    if (!useClientCounts) return undefined;
    const m = new Map<string, number>();
    for (const o of filteredData) {
      if (!o.obj_type) continue;
      m.set(o.obj_type, (m.get(o.obj_type) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([obj_type, n]) => ({ obj_type, n }));
  }, [useClientCounts, filteredData]);

  const paginatedData = useMemo(() => {
    if (!isClientFiltered) return filteredData;
    const start = clientPage * CLIENT_PAGE_SIZE;
    return filteredData.slice(start, start + CLIENT_PAGE_SIZE);
  }, [filteredData, clientPage, isClientFiltered]);
  const clientTotalPages = Math.ceil(filteredData.length / CLIENT_PAGE_SIZE);

  const nightWindow = useMemo(() => {
    const fallback = presets.civil ?? presets.nautical ?? presets.astro ?? presets.bounds;
    const start = windowStart ?? fallback.start;
    const end = windowEnd ?? fallback.end;
    const toMs = (p: { start: Date; end: Date } | null | undefined) =>
      p ? { startMs: p.start.getTime(), endMs: p.end.getTime() } : null;
    return {
      startMs: Math.max(
        Math.min(start.getTime(), presets.bounds.end.getTime()),
        presets.bounds.start.getTime(),
      ),
      endMs: Math.min(
        Math.max(end.getTime(), presets.bounds.start.getTime()),
        presets.bounds.end.getTime(),
      ),
      minMs: presets.bounds.start.getTime(),
      maxMs: presets.bounds.end.getTime(),
      activePreset,
      presetAvail: {
        astro: !!presets.astro,
        nautical: !!presets.nautical,
        civil: !!presets.civil,
      },
      presetTimes: {
        astro: toMs(presets.astro),
        nautical: toMs(presets.nautical),
        civil: toMs(presets.civil),
      },
      onPresetSelect: selectPreset,
      onWindowChange: (s: number, e: number) => {
        setWindowStart(new Date(s));
        setWindowEnd(new Date(e));
        setActivePreset("custom");
      },
      formatMs: (ms: number) => {
        const d = new Date(ms);
        return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
      },
    };
  }, [activePreset, presets, selectPreset, setActivePreset, setWindowEnd, setWindowStart, windowEnd, windowStart]);


  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="4,800+ Deep Sky Objects Catalog — Sky Atlas"
        description="Catalog of 4,800+ deep sky objects: galaxies, nebulae, clusters. Filter by type, constellation, magnitude, best season. Each object includes exposure guide, photogenicity score and framing preview."
        keywords="Messier catalog, NGC catalog, galaxy, nebula, open cluster, globular cluster, planetary nebula, deep sky objects, astrophotography targets, star cluster"
        canonical="https://cosmicframe.app/sky-atlas"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "Cosmic Frame Celestial Objects Catalog",
          "creator": {
            "@type": "Organization",
            "name": "Cosmic Frame",
            "url": "https://cosmicframe.app"
          },
          "description": "Catalog of 4,800+ deep sky objects for astrophotography with exposure guides, photogenicity scores, and session planning data.",
          "url": "https://cosmicframe.app/sky-atlas",
          "keywords": ["astronomy", "astrophotography", "Messier", "NGC", "deep sky"],
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "variableMeasured": ["magnitude", "angular size", "photogenicity score", "exposure time"]
        }}
      />
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" />
            {tAtlas("title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            {tAtlas("subtitle")}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1 flex flex-wrap items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {userPos.lat.toFixed(2)}°, {userPos.lng.toFixed(2)}° — {tAtlas("objectsCount", { count: displayedTotal > 0 ? displayedTotal.toLocaleString() : "..." })}
            {(geoStatus === "default" || geoStatus === "denied") && (
              <button
                type="button"
                onClick={handleGeolocation}
                className="text-xs text-primary hover:underline focus:outline-none focus:underline"
              >
                {tAtlas("location.useMyLocation")}
              </button>
            )}
            {geoStatus === "granted" && (
              <span className="text-xs text-primary">{tAtlas("location.yourLocation")}</span>
            )}
            {geoStatus === "requesting" && (
              <span className="text-xs text-muted-foreground">{tAtlas("location.requesting")}</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            {tAtlas("popularTargets.label")}{' '}
            <Link to={lp(`/object/${encodeURIComponent('M 42')}`)} className="text-primary hover:underline">{tAtlas("popularTargets.orion")}</Link>{' · '}
            <Link to={lp(`/object/${encodeURIComponent('M 31')}`)} className="text-primary hover:underline">{tAtlas("popularTargets.andromeda")}</Link>{' · '}
            <Link to={lp(`/object/${encodeURIComponent('M 45')}`)} className="text-primary hover:underline">{tAtlas("popularTargets.pleiades")}</Link>{' · '}
            <Link to={lp(`/object/${encodeURIComponent('M 51')}`)} className="text-primary hover:underline">{tAtlas("popularTargets.whirlpool")}</Link>
          </p>
        </motion.div>

        <TonightTopPicks
          lat={userPos.lat}
          lng={userPos.lng}
          onSelect={setSelected}
          sunset={presets.bounds?.start ?? null}
          sunrise={presets.bounds?.end ?? null}
          astroDuskEnd={presets.astro?.start ?? null}
          astroDawnBegin={presets.astro?.end ?? null}
        />

        <AtlasFilters
          filters={filters}
          onChange={(f) => {
            if (f.search.trim() && visibleTonight) {
              setVisibleTonight(false);
            }
            setFilters({
              ...f,
              excludeTypes: f.search.trim() || f.catalog ? [] : DEFAULT_EXCLUDE_TYPES,
            });
          }}
          types={types}
          typeBuckets={typeBuckets}
          constellations={constellations}
          totalCount={displayedTotal}
          visibleTonightEnabled={visibleTonight}
          onToggleVisibleTonight={() => {
            setVisibleTonight((v) => !v);
            setActivePreset("civil");
          }}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          nightWindow={nightWindow}
          typeCounts={clientTypeCounts ?? typeCounts}
        />

        {/* Accessibility score explanation */}
        <Collapsible open={scoreInfoOpen} onOpenChange={setScoreInfoOpen} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <h2 className="text-sm font-semibold text-primary">
                  {tAtlas("score.heading")}
                </h2>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${scoreInfoOpen ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-1 space-y-3 text-sm text-muted-foreground border-t border-primary/10">
              <p>
                <Trans i18nKey="score.intro" t={tAtlas} components={[<span key="0" className="text-primary font-medium" />]} />
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-primary/70">
                <li>
                  <Trans i18nKey="score.size" t={tAtlas} components={[<span key="0" className="text-foreground font-medium" />]} />
                </li>
                <li>
                  <Trans i18nKey="score.brightness" t={tAtlas} components={[<span key="0" className="text-foreground font-medium" />]} />
                </li>
                <li>
                  <Trans i18nKey="score.type" t={tAtlas} components={[<span key="0" className="text-foreground font-medium" />]} />
                </li>
                <li>
                  <Trans i18nKey="score.rgb" t={tAtlas} components={[<span key="0" className="text-foreground font-medium" />]} />
                </li>
              </ul>
              <p>
                {tAtlas("score.universal")}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {tAtlas("score.note")}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>


        {/* Solar system results */}
        {solarResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{tAtlas("solarSystem")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {solarResults.map(obj => (
                <div key={obj.id} className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-primary/20">
                  {obj.image_url && (
                    <img src={obj.image_url} alt={obj.name} width={64} height={64} loading="lazy" decoding="async" className="w-16 h-16 object-cover rounded-lg bg-black shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {obj.color_hex && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: obj.color_hex }} />}
                      <h4 className="font-semibold text-sm text-foreground truncate">{obj.name}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{obj.type}</p>
                    {obj.max_apparent_size_arcsec && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {obj.max_apparent_size_arcsec >= 60
                          ? `${(obj.max_apparent_size_arcsec / 60).toFixed(1)}'`
                          : `${obj.max_apparent_size_arcsec.toFixed(1)}"`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading || (isClientFiltered && largeSetLoading && !largeSet) ? (
          <div className="space-y-3">
            {isClientFiltered && largeSetLoading && (
              <p className="text-xs text-muted-foreground text-center">
                Loading candidate objects for visibility computation…
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 h-40 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {showNoAstroNote && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>No full astronomical night tonight — try <strong>Nautical</strong> or <strong>Civil</strong>.</span>
              </div>
            )}
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Telescope className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No objects match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(isClientFiltered ? paginatedData : allLoadedData).map((obj, i) => (
                  <ObjectCard
                    key={obj.id}
                    obj={obj}
                    index={i}
                    lat={userPos.lat}
                    lng={userPos.lng}
                    searchQuery={filters.search}
                    onClick={() => setSelected(obj)}
                    isTopPick={topPickIds?.has(obj.catalog_id) ?? false}
                    maxAltInWindow={(obj as CelestialObject & { _maxAltInWindow?: number })._maxAltInWindow}
                    sunset={presets.bounds?.start ?? null}
                    sunrise={presets.bounds?.end ?? null}
                    astroDuskEnd={presets.astro?.start ?? null}
                    astroDawnBegin={presets.astro?.end ?? null}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Load more button */}
        {!isClientFiltered && allLoadedData.length < totalCount && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="gap-1">
              Load more (30)
            </Button>
            <span className="text-xs text-muted-foreground font-mono">
              Showing {allLoadedData.length} of {totalCount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Client-side pagination for filtered views */}
        {isClientFiltered && clientTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" disabled={clientPage === 0} onClick={() => setClientPage((p) => p - 1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground font-mono">
              {clientPage + 1} / {clientTotalPages}
            </span>
            <Button variant="outline" size="sm" disabled={clientPage >= clientTotalPages - 1} onClick={() => setClientPage((p) => p + 1)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* About the Catalog */}
        <details className="space-y-6 pt-8 border-t border-border/20 mt-10">
          <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
            About the Deep Sky Object Catalog
          </summary>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              This catalog contains over 4,800 deep sky objects spanning the complete
              <span className="text-foreground/80 font-medium"> Messier catalog</span> (110 objects), the
              <span className="text-foreground/80 font-medium"> NGC</span> and
              <span className="text-foreground/80 font-medium"> IC</span> catalogs, plus the
              <span className="text-foreground/80 font-medium"> Sharpless</span> catalog of H-II regions.
              You can filter by object type — galaxies, emission nebulae, planetary nebulae, open clusters, globular clusters, dark nebulae and more —
              or narrow results by constellation, magnitude, angular size and best observation season.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Every object includes an exposure guide with recommended fast and deep integration times,
              a photogenicity score that ranks how rewarding a target is to photograph, and a framing preview
              that shows how the object fits in your telescope and camera field of view. Use these tools to plan
              your next deep sky imaging session with confidence.
            </p>
          </div>
        </details>
      </main>

      <Footer />

      <ObjectDetailModal
        obj={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSelect={(obj) => setSelected(obj)}
        lat={userPos.lat}
        lng={userPos.lng}
        focalLength={equipment.focalLength}
        sensorWidth={equipment.sensorWidth}
        sensorHeight={equipment.sensorHeight}
        sunset={presets.bounds?.start ?? null}
        sunrise={presets.bounds?.end ?? null}
        astroDuskEnd={presets.astro?.start ?? null}
        astroDawnBegin={presets.astro?.end ?? null}
      />
    </div>
  );
};

export default SkyAtlas;
