import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useUserRigs";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import AtlasFilters from "@/components/atlas/AtlasFilters";
import ObjectCard from "@/components/atlas/ObjectCard";
import ObjectDetailModal from "@/components/atlas/ObjectDetailModal";
import {
  useCelestialObjects,
  useDistinctFilters,
  CelestialFilters,
  CelestialObject,
  PAGE_SIZE,
} from "@/hooks/useCelestialObjects";
import { calculateAltitude } from "@/lib/visibility";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Telescope, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SolarSystemObject } from "@/hooks/useSolarSystemObjects";

import TonightTopPicks from "@/components/atlas/TonightTopPicks";

const DEFAULT_EXCLUDE_TYPES = ["Star", "Double Star"];

const defaultFilters: CelestialFilters = {
  search: "",
  objTypes: [],
  excludeTypes: DEFAULT_EXCLUDE_TYPES,
  constellation: "",
  maxMagnitude: 20,
  minPhotoScore: 0,
  sortBy: "photo_score",
  sizeCategory: "",
};

const SkyAtlas = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<CelestialFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CelestialObject | null>(null);
  const [userPos, setUserPos] = useState({ lat: 45.7347, lng: 4.4931 });
  const [visibleTonight, setVisibleTonight] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [clientPage, setClientPage] = useState(0);
  const CLIENT_PAGE_SIZE = 20;
  const { userId } = useCurrentUser();

  const [equipment, setEquipment] = useState({
    focalLength: 0,
    sensorWidth: 0,
    sensorHeight: 0,
  });

  const { types, constellations } = useDistinctFilters();
  const { data, isLoading } = useCelestialObjects(filters, page);

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
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    try {
      const saved = localStorage.getItem("cosmicframe_equipment") || localStorage.getItem("astrodash_equipment");
      if (saved) setEquipment(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => { setPage(0); setClientPage(0); }, [filters, visibleTonight, filterMode]);

  // Client-side filters: visible tonight + filter mode
  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    let results = data.data;

    if (visibleTonight) {
      results = results.filter((obj) => {
        if (obj.ra_deg == null || obj.dec_deg == null) return false;
        const alt = calculateAltitude(obj.ra_deg, obj.dec_deg, userPos.lat, userPos.lng);
        return alt > 0;
      });
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
  }, [data?.data, visibleTonight, filterMode, userPos.lat, userPos.lng]);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const isClientFiltered = visibleTonight || filterMode !== "all";
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
        description="Explore 4,800+ celestial objects: galaxies, nebulae, star clusters, planetary nebulae. Complete Messier, NGC, IC, Sharpless catalog with exposure guide, photogenicity score, and best observation months."
        keywords="Messier catalog, NGC catalog, galaxy, nebula, open cluster, globular cluster, planetary nebula, deep sky objects, astrophotography targets, star cluster"
        path="/sky-atlas"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "Cosmic Frame Celestial Objects Catalog",
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
            Sky Atlas
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {userPos.lat.toFixed(2)}°, {userPos.lng.toFixed(2)}° — Explore {data?.count?.toLocaleString() ?? "..."} celestial objects
          </p>
        </motion.div>

        <TonightTopPicks lat={userPos.lat} lng={userPos.lng} onSelect={setSelected} />

        <AtlasFilters
          filters={filters}
          onChange={(f) => setFilters({
            ...f,
            excludeTypes: f.search.trim() ? [] : DEFAULT_EXCLUDE_TYPES,
          })}
          types={types}
          constellations={constellations}
          totalCount={visibleTonight || filterMode !== "all" ? filteredData.length : (data?.count ?? 0)}
          visibleTonightEnabled={visibleTonight}
          onToggleVisibleTonight={() => setVisibleTonight((v) => !v)}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
        />

        {/* Solar system results */}
        {solarResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Solar System</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {solarResults.map(obj => (
                <div key={obj.id} className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-primary/20">
                  {obj.image_url && (
                    <img src={obj.image_url} alt={obj.name} className="w-16 h-16 object-cover rounded-lg bg-black shrink-0" />
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Telescope className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No objects match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedData.map((obj, i) => (
              <ObjectCard
                key={obj.id}
                obj={obj}
                index={i}
                lat={userPos.lat}
                lng={userPos.lng}
                searchQuery={filters.search}
                onClick={() => setSelected(obj)}
              />
            ))}
          </div>
        )}

        {/* Server-side pagination */}
        {!isClientFiltered && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground font-mono">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
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
