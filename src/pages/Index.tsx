import { Link } from "react-router-dom";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ObservationToolbar from "@/components/ObservationToolbar";
import MoonPhaseCard from "@/components/MoonPhaseCard";
import SunTimesCard from "@/components/SunTimesCard";
import HourlyWeatherCard from "@/components/HourlyWeatherCard";
import CelestialCatalog from "@/components/CelestialCatalog";
import EphemeridesCard from "@/components/EphemeridesCard";
import ToolSuggestions from "@/components/ToolSuggestions";
import { motion } from "framer-motion";

const DashboardContent = () => {
  const { location } = useObservation();

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Météo Astro ce soir & Planificateur d'Astrophotographie"
        description="Consultez la météo astro en temps réel, les éphémérides, la phase de la lune, et découvrez les meilleures cibles à photographier ce soir. Planifiez vos sessions d'astrophotographie depuis votre position."
        keywords="météo astro, astrophotographie ce soir, quoi photographier cette nuit, phase lune, éphémérides astronomie, cibles deep sky, conditions observation, seeing, couverture nuageuse astro"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EphemeridesCard />
          <CelestialCatalog />
        </div>

        <ToolSuggestions />

        {/* SEO Content Section */}
        <section className="space-y-6 pt-8 border-t border-border/20">
          <div>
            <h2 className="text-lg font-semibold text-foreground/80">
              Votre assistant d'astrophotographie complet
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
              AstroDash est un outil gratuit de planification d'astrophotographie.
              Consultez la météo astro en temps réel (couverture nuageuse, seeing, transparence, humidité),
              les éphémérides astronomiques (lever/coucher du soleil, crépuscule astronomique,
              phase de la lune), et découvrez les meilleures cibles à photographier ce soir
              depuis votre position.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <article>
              <h3 className="text-sm font-medium text-foreground/70">📡 Catalogue céleste</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Plus de 4 800 objets du ciel profond : galaxies, nébuleuses à émission,
                nébuleuses planétaires, amas ouverts, amas globulaires, nébuleuses sombres,
                rémanents de supernova. Catalogues Messier (110 objets), NGC, IC, Sharpless, Abell complets.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🔭 Matériel astrophoto</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Comparez plus de 360 équipements : télescopes (Newton, réfracteur, Schmidt-Cassegrain),
                caméras astro (ZWO, QHY, Player One, Moravian), montures équatoriales
                (Sky-Watcher HEQ5, EQM-35, ZWO AM5, iOptron), filtres et accessoires.
                Prix et liens vers Pierro Astro, Astroshop, Astronome.fr, Amazon.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">⚙️ Calculateurs</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Calculez l'échantillonnage (arcsec/pixel), le champ de vue (FOV),
                la compatibilité capteur/cercle d'image, le rapport charge/monture,
                le backfocus du train optique. Vérifiez si votre setup est adapté
                aux conditions de seeing locales.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🌙 Météo & éphémérides</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Prévisions météo astronomiques heure par heure, phase lunaire précise,
                horaires de crépuscule astronomique, lever et coucher de lune.
                Identifiez les fenêtres d'observation optimales pour votre nuit d'imagerie.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">🗺️ Pollution lumineuse</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Carte interactive de pollution lumineuse. Trouvez les meilleurs sites
                d'observation en France : zones Bortle 1 à 4, réserves de ciel étoilé,
                parcs naturels. Idéal pour planifier vos sorties astrophoto.
              </p>
            </article>
            <article>
              <h3 className="text-sm font-medium text-foreground/70">📸 Guide d'exposition</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Chaque objet céleste dispose d'un guide d'exposition : temps de pose rapide et deep,
                filtre recommandé (L-Pro, Ha, OIII, SII), tolérance lunaire,
                meilleurs mois d'observation, et score de photogénie.
              </p>
            </article>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground/70 leading-relaxed">
            <div>
              <h3 className="text-sm font-medium text-foreground/60 mb-1">Marques et revendeurs référencés</h3>
              <p>
                Télescopes : Sky-Watcher, Takahashi, William Optics, Askar, Celestron, Meade, Explore Scientific, SharpStar, TS-Optics, Samyang, Sigma, Orion, SVBONY, GSO.
                Caméras astro : ZWO (ASI2600MC Pro, ASI533MC Pro, ASI585MC, ASI294MC Pro), QHY (QHY268M, QHY600M), Player One (Poseidon, Uranus, Ares), Moravian, Altair, ToupTek, Rising Cam.
                Montures : Sky-Watcher (HEQ5, EQM-35, EQ6-R), ZWO (AM3, AM5), iOptron (CEM26, CEM40, GEM45), Takahashi, Losmandy, 10Micron, Pegasus Astro, Rainbow Astro, Avalon.
                Filtres : Optolong, ZWO, Baader, Astronomik, IDAS, Antlia, Chroma, STC.
                Revendeurs : Pierro Astro, Astroshop, Astronome.fr, Optique Unterlinden, Amazon.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground/60 mb-1">Types d'objets dans le catalogue</h3>
              <p>
                Galaxies spirales et elliptiques (3 300+), nébuleuses à émission (260+), amas ouverts (480+),
                amas globulaires (179), nébuleuses sombres et nuages moléculaires (155+),
                amas de galaxies (144), nébuleuses planétaires (140), nébuleuses par réflexion,
                rémanents de supernova, associations stellaires.
                Objets célèbres : Nébuleuse d'Orion (M42), Galaxie d'Andromède (M31), Pléiades (M45),
                Nébuleuse de l'Aigle (M16, Piliers de la Création), Nébuleuse du Voile (NGC 6960/6992),
                Nébuleuse North America (NGC 7000), Nébuleuse de la Rosette (NGC 2244),
                Nébuleuse de la Lagune (M8), Nébuleuse du Crabe (M1), Nébuleuse de la Carène (NGC 3372).
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
