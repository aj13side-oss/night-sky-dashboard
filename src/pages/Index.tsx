import { Link } from "react-router-dom";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ObservationToolbar from "@/components/ObservationToolbar";
import MoonPhaseCard from "@/components/MoonPhaseCard";
import SunTimesCard from "@/components/SunTimesCard";
import HourlyWeatherCard from "@/components/HourlyWeatherCard";
import EphemeridesCard from "@/components/EphemeridesCard";
import PlanetsTonight from "@/components/dashboard/PlanetsTonight";
import DeepSkyTonight from "@/components/dashboard/DeepSkyTonight";
import SpecialEvents from "@/components/dashboard/SpecialEvents";
import TonightList from "@/components/dashboard/TonightList";
import { motion } from "framer-motion";

const DashboardContent = () => {
  const { location } = useObservation();

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Astro Weather Tonight & Astrophotography Planner"
        description="Check real-time astro weather, ephemerides, moon phase, and discover the best targets to photograph tonight. Plan your astrophotography sessions from your location."
        keywords="astro weather, astrophotography tonight, what to photograph tonight, moon phase, astronomy ephemerides, deep sky targets, observation conditions, seeing, cloud cover, météo astro, astrophotographie"
        path="/"
      />
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Tonight's Sky
          </h1>
          <p className="text-muted-foreground mt-1">
            Your astrophotography planning dashboard — {location.name}
          </p>
        </motion.div>

        <ObservationToolbar />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MoonPhaseCard />
          <SunTimesCard />
        </div>

        <HourlyWeatherCard />

        {/* 3-card layout: Planets | Deep Sky (wider) | Special Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <PlanetsTonight />
          </div>
          <div className="lg:col-span-6">
            <DeepSkyTonight />
          </div>
          <div className="lg:col-span-3">
            <SpecialEvents />
          </div>
        </div>

        <TonightList />

        <EphemeridesCard />
import TonightList from "@/components/dashboard/TonightList";

        {/* SEO Content Section */}
        <section className="space-y-6 pt-8 border-t border-border/20">
          <div>
            <h2 className="text-lg font-semibold text-foreground/80">
              Your complete astrophotography assistant
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
              Cosmic Frame is a free astrophotography planning tool.
              Check real-time astro weather (cloud cover, seeing, transparency, humidity),
              astronomical ephemerides (sunrise/sunset, astronomical twilight,
              moon phase), and discover the best targets to photograph tonight
              from your location.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <article>
              <h3 className="text-sm font-medium text-foreground/70">📡 Sky Catalog</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Over 4,800 deep sky objects: galaxies, emission nebulae,
                planetary nebulae, open clusters, globular clusters, dark nebulae,
                supernova remnants. Complete Messier (110 objects), NGC, IC, Sharpless, Abell catalogs.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🔭 Astrophotography Gear</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Compare 360+ equipment: telescopes (Newton, refractor, Schmidt-Cassegrain),
                astro cameras (ZWO, QHY, Player One, Moravian), equatorial mounts
                (Sky-Watcher HEQ5, EQM-35, ZWO AM5, iOptron), filters and accessories.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">⚙️ Calculators</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Calculate sampling (arcsec/pixel), field of view (FOV),
                sensor vs image circle compatibility, payload/mount ratio,
                optical train backfocus.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🌙 Weather & Ephemerides</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Hourly astronomical weather forecasts, precise moon phase,
                astronomical twilight times, moonrise and moonset.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🗺️ Light Pollution</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Interactive light pollution map. Find the best observation sites:
                Bortle 1–4 zones, dark sky reserves, natural parks.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">📸 Exposure Guide</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Each celestial object has an exposure guide: fast and deep integration times,
                recommended filter (L-Pro, Ha, OIII, SII), moon tolerance,
                best months for observation, and photogenicity score.
              </p>
            </article>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground/70 leading-relaxed">
            <div>
              <h3 className="text-sm font-medium text-foreground/60 mb-1">Featured brands and retailers</h3>
              <p>
                Telescopes: Sky-Watcher, Takahashi, William Optics, Askar, Celestron, Meade, Explore Scientific, SharpStar, TS-Optics, Samyang, Sigma, Orion, SVBONY, GSO.
                Astro cameras: ZWO (ASI2600MC Pro, ASI533MC Pro, ASI585MC, ASI294MC Pro), QHY (QHY268M, QHY600M), Player One (Poseidon, Uranus, Ares), Moravian, Altair, ToupTek, Rising Cam.
                Mounts: Sky-Watcher (HEQ5, EQM-35, EQ6-R), ZWO (AM3, AM5), iOptron (CEM26, CEM40, GEM45), Takahashi, Losmandy, 10Micron, Pegasus Astro, Rainbow Astro, Avalon.
                Filters: Optolong, ZWO, Baader, Astronomik, IDAS, Antlia, Chroma, STC.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground/60 mb-1">Object types in the catalog</h3>
              <p>
                Spiral and elliptical galaxies (3,300+), emission nebulae (260+), open clusters (480+),
                globular clusters (179), dark nebulae and molecular clouds (155+),
                galaxy clusters (144), planetary nebulae (140), reflection nebulae,
                supernova remnants, stellar associations.
                Famous objects: Orion Nebula (M42), Andromeda Galaxy (M31), Pleiades (M45),
                Eagle Nebula (M16, Pillars of Creation), Veil Nebula (NGC 6960/6992),
                North America Nebula (NGC 7000), Rosette Nebula (NGC 2244),
                Lagoon Nebula (M8), Crab Nebula (M1), Carina Nebula (NGC 3372).
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const Index = () => (
  <ObservationProvider>
    <DashboardContent />
  </ObservationProvider>
);

export default Index;
