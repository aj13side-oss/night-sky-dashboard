import { useState, useCallback, useRef } from "react";
import { ObservationProvider, useObservation } from "@/contexts/ObservationContext";
import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TonightHero from "@/components/tonight/TonightHero";
import TimelineBar from "@/components/tonight/TimelineBar";
import TonightTargetList from "@/components/tonight/TonightTargetList";
import WeatherTimeline from "@/components/tonight/WeatherTimeline";
import ImagingStrategy from "@/components/tonight/ImagingStrategy";
import SessionPlanner, { SessionTarget } from "@/components/tonight/SessionPlanner";
import ObservationToolbar from "@/components/ObservationToolbar";
import { useAstronomyData } from "@/hooks/useAstronomyData";
import { useQuery } from "@tanstack/react-query";
import { getMoonPhaseInfo } from "@/lib/moon-phase";
import { motion } from "framer-motion";

const TonightContent = () => {
  const { date, location } = useObservation();
  const { data: astro } = useAstronomyData();
  const moon = getMoonPhaseInfo(date);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [sessionTargets, setSessionTargets] = useState<SessionTarget[]>([]);

  // Simple observation score from weather
  const dateStr = date.toISOString().split("T")[0];
  const { data: weatherData } = useQuery({
    queryKey: ["weather-score-tonight", location.lat, location.lng, dateStr],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ lat: location.lat, lng: location.lng, date: dateStr }),
        }
      );
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute simple score from clouds
  const nightHours = (weatherData?.openMeteo ?? []).filter((h: any) => {
    const normalized = h.time.replace(" ", "T");
    const hourNum = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "0");
    const day = normalized.split("T")[0];
    const nextDay = new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = nextDay.toISOString().split("T")[0];
    return (day === dateStr && hourNum >= 18) || (day === nextDateStr && hourNum <= 6);
  });

  const avgClouds = nightHours.length > 0
    ? nightHours.reduce((sum: number, h: any) => sum + (h.clouds ?? 50), 0) / nightHours.length
    : null;

  const obsScore = avgClouds !== null ? Math.round(Math.max(0, 100 - avgClouds)) : null;

  // Find best clear hour
  const bestClearHour = nightHours.length > 0
    ? (() => {
        const best = nightHours.reduce((a: any, b: any) => (a.clouds < b.clouds ? a : b));
        return best.time.replace(" ", "T").split("T")[1]?.substring(0, 5) ?? null;
      })()
    : null;

  const addToSession = useCallback((catalogId: string) => {
    setSessionIds((prev) => prev.includes(catalogId) ? prev : [...prev, catalogId]);
  }, []);

  const removeFromSession = useCallback((catalogId: string) => {
    setSessionIds((prev) => prev.filter((id) => id !== catalogId));
  }, []);

  // Dummy ranked targets for ImagingStrategy (will be populated from TonightTargetList data)
  // For simplicity, pass empty — the strategy card can work with the session targets
  const rankedForStrategy = sessionTargets.length > 0
    ? [] // ImagingStrategy uses its own targets prop
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Tonight's Best Astrophotography Targets"
        description={`Top deep sky objects visible tonight. Moon at ${moon.illumination}%. Plan your astrophotography session with Cosmic Frame.`}
        path="/tonight"
      />
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <TonightHero
          onChangeLocation={() => setShowToolbar((v) => !v)}
          observationScore={obsScore}
        />

        {showToolbar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <ObservationToolbar />
          </motion.div>
        )}

        <TimelineBar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <WeatherTimeline />

            <ImagingStrategy
              targets={[]}
              avgCloudCover={avgClouds}
              bestClearHour={bestClearHour}
            />

            <TonightTargetList
              sessionIds={sessionIds}
              onAddToSession={addToSession}
            />
          </div>

          {/* Sidebar — Session Planner */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              <SessionPlanner
                sessionIds={sessionIds}
                onRemove={removeFromSession}
                onUpdateTargets={setSessionTargets}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const TonightPage = () => (
  <ObservationProvider>
    <TonightContent />
  </ObservationProvider>
);

export default TonightPage;
