import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Telescope, MapPin } from "lucide-react";
import ToolSuggestions from "@/components/ToolSuggestions";
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
  const [filters, setFilters] = useState<CelestialFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CelestialObject | null>(null);
  const [userPos, setUserPos] = useState({ lat: 48.8566, lng: 2.3522 });

  // Equipment settings from localStorage (synced with FOV page)
  const [equipment, setEquipment] = useState({
    focalLength: 0,
    sensorWidth: 0,
    sensorHeight: 0,
  });

  const { types, constellations } = useDistinctFilters();
  const { data, isLoading } = useCelestialObjects(filters, page);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );

    // Load equipment from localStorage
    try {
      const saved = localStorage.getItem("astrodash_equipment");
      if (saved) setEquipment(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => setPage(0), [filters]);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Catalogue de 4 800+ Objets Célestes — Atlas du Ciel"
        description="Explorez 4 800+ objets célestes : galaxies, nébuleuses, amas d'étoiles, nébuleuses planétaires. Catalogue Messier, NGC, IC, Sharpless complet avec guide d'exposition, score de photogénie, et meilleurs mois d'observation."
        keywords="catalogue Messier, catalogue NGC, galaxie, nébuleuse, amas ouvert, amas globulaire, nébuleuse planétaire, deep sky objects, nebula, galaxy, star cluster, astrophotography targets"
        path="/sky-atlas"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "AstroDash Celestial Objects Catalog",
          "description": "Catalogue de 4 800+ objets célestes pour l'astrophotographie avec guides d'exposition, scores de photogénie, et données de planification de session.",
          "url": "https://astrodash.fr/sky-atlas",
          "keywords": ["astronomie", "astrophotographie", "Messier", "NGC", "deep sky"],
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "variableMeasured": ["magnitude", "taille angulaire", "score photogénie", "temps exposition"]
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

        {/* Tonight's Top Picks */}
        <TonightTopPicks lat={userPos.lat} lng={userPos.lng} onSelect={setSelected} />

        <AtlasFilters
          filters={filters}
          onChange={(f) => setFilters({
            ...f,
            excludeTypes: f.search.trim() ? [] : DEFAULT_EXCLUDE_TYPES,
          })}
          types={types}
          constellations={constellations}
          totalCount={data?.count ?? 0}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Telescope className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No objects match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((obj, i) => (
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

        {totalPages > 1 && (
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
        <ToolSuggestions />
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
