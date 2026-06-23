import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";

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
import { getObjectRiseSetTransit } from "@/lib/rise-set";
import { getAstronomicalNight } from "@/lib/astronomy";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Telescope, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SolarSystemObject } from "@/hooks/useSolarSystemObjects";

import TonightTopPicks from "@/components/atlas/TonightTopPicks";
import { useTopPhotoTargets } from "@/hooks/useTopPhotoTargets";

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
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<CelestialFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [allLoadedData, setAllLoadedData] = useState<CelestialObject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<CelestialObject | null>(null);
  const [userPos, setUserPos] = useState({ lat: 45.7347, lng: 4.4931 });
  const [geoStatus, setGeoStatus] = useState<'default' | 'requesting' | 'granted' | 'denied'>('default');
  const [visibleTonight, setVisibleTonight] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [minHoursVisible, setMinHoursVisible] = useState(0);
  const [clientPage, setClientPage] = useState(0);
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

  const isClientFiltered = visibleTonight || filterMode !== "all";

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

  useEffect(() => { setPage(0); setClientPage(0); setAllLoadedData([]); }, [filters, visibleTonight, filterMode]);

  // Client-side filters: visible tonight + filter mode
  const sourceData = useMemo<CelestialObject[]>(() => {
    if (isClientFiltered && largeSet && largeSet.length > 0) return largeSet;
    return allLoadedData;
  }, [isClientFiltered, largeSet, allLoadedData]);

  const filteredData = useMemo(() => {
    if (!sourceData.length) return [];
    let results: (CelestialObject & { _hoursVisible?: number })[] = sourceData;

    if (visibleTonight) {
      const night = getAstronomicalNight(new Date(), userPos.lat, userPos.lng);
      const nightStart = night.start;
      const nightEnd = night.end;
      results = results
        .map((obj) => {
          if (obj.ra_deg == null || obj.dec_deg == null) return null;
          const rs = getObjectRiseSetTransit(obj.ra_deg, obj.dec_deg, userPos.lat, userPos.lng, new Date());
          if (rs.neverRises) return null;
          let hoursVisible = 0;
          if (rs.isCircumpolar) {
            hoursVisible = Math.max(0, (nightEnd.getTime() - nightStart.getTime()) / 3600000);
          } else if (rs.riseTime || rs.setTime) {
            const start = rs.riseTime && rs.riseTime > nightStart ? rs.riseTime : nightStart;
            const end = rs.setTime && rs.setTime < nightEnd ? rs.setTime : nightEnd;
            hoursVisible = Math.max(0, (end.getTime() - start.getTime()) / 3600000);
          }
          return { ...obj, _hoursVisible: hoursVisible };
        })
        .filter((obj): obj is NonNullable<typeof obj> => obj !== null && (obj._hoursVisible ?? 0) >= minHoursVisible);
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

    return results;
  }, [sourceData, visibleTonight, filterMode, userPos.lat, userPos.lng, minHoursVisible]);

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
            Deep Sky Object Atlas
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Browse 4,800+ deep sky objects — filter Messier, NGC and IC catalogs by type, constellation, magnitude and best season.
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1 flex flex-wrap items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {userPos.lat.toFixed(2)}°, {userPos.lng.toFixed(2)}° — {displayedTotal > 0 ? displayedTotal.toLocaleString() : "..."} objects
            {(geoStatus === "default" || geoStatus === "denied") && (
              <button
                type="button"
                onClick={handleGeolocation}
                className="text-xs text-primary hover:underline focus:outline-none focus:underline"
              >
                Using default location Lyon — Use my location
              </button>
            )}
            {geoStatus === "granted" && (
              <span className="text-xs text-primary">Your location</span>
            )}
            {geoStatus === "requesting" && (
              <span className="text-xs text-muted-foreground">Requesting location...</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Popular targets:{' '}
            <Link to={`/object/${encodeURIComponent('M 42')}`} className="text-primary hover:underline">Orion Nebula (M42) astrophotography</Link>{' · '}
            <Link to={`/object/${encodeURIComponent('M 31')}`} className="text-primary hover:underline">Andromeda Galaxy (M31) astrophotography</Link>{' · '}
            <Link to={`/object/${encodeURIComponent('M 45')}`} className="text-primary hover:underline">Pleiades (M45) astrophotography</Link>{' · '}
            <Link to={`/object/${encodeURIComponent('M 51')}`} className="text-primary hover:underline">Whirlpool Galaxy (M51) astrophotography</Link>
          </p>
        </motion.div>

        <TonightTopPicks lat={userPos.lat} lng={userPos.lng} onSelect={setSelected} />

        <AtlasFilters
          filters={filters}
          onChange={(f) => setFilters({
            ...f,
            excludeTypes: f.search.trim() || f.catalog ? [] : DEFAULT_EXCLUDE_TYPES,
          })}
          types={types}
          typeBuckets={typeBuckets}
          constellations={constellations}
          totalCount={displayedTotal}
          visibleTonightEnabled={visibleTonight}
          onToggleVisibleTonight={() => { setVisibleTonight((v) => !v); setMinHoursVisible(0); }}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          minHoursVisible={minHoursVisible}
          onMinHoursVisibleChange={setMinHoursVisible}
          typeCounts={clientTypeCounts ?? typeCounts}
        />

        {/* Solar system results */}
        {solarResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Solar System</h3>
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
        ) : filteredData.length === 0 ? (
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
              />
            ))}
          </div>
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
      />
    </div>
  );
};

export default SkyAtlas;
