import { Link } from "react-router-dom";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import AppNav from "@/components/AppNav";
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
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Tonight's Sky
          </h2>
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
      </main>

      <footer className="border-t border-border/30 mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>AstroDash — Your astrophotography planning companion</p>
      </footer>
    </div>
  );
};

const Index = () => (
  <ObservationProvider>
    <DashboardContent />
  </ObservationProvider>
);

export default Index;
