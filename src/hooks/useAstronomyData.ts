import { useQuery } from "@tanstack/react-query";
import { useObservation } from "@/contexts/ObservationContext";

interface AstronomySunData {
  sunrise: string | null;
  sunset: string | null;
  solarNoon: string | null;
  civilTwilightBegin: string | null;
  civilTwilightEnd: string | null;
  nauticalTwilightBegin: string | null;
  nauticalTwilightEnd: string | null;
  astronomicalTwilightBegin: string | null;
  astronomicalTwilightEnd: string | null;
}

interface AstronomyMoonData {
  phase: string | null;
  fracillum: number | null;
  moonrise: string | null;
  moonset: string | null;
  transit: string | null;
  closestPhase: { phase: string; day: number; month: number; year: number; time: string } | null;
}

interface MoonPhaseEntry {
  phase: string;
  day: number;
  month: number;
  year: number;
  time: string;
}

export interface PlanetData {
  rise: string | null;
  set: string | null;
  transit: string | null;
  transitAlt: number | null;
  ra: number | null;
  dec: number | null;
  magnitude: number | null;
  constellation: string | null;
}

export interface AstronomyData {
  sun: AstronomySunData | null;
  moon: AstronomyMoonData | null;
  moonPhases: MoonPhaseEntry[] | null;
  planets: Record<string, PlanetData> | null;
  error: string | null;
}

export function useAstronomyData() {
  const { date, location } = useObservation();
  const dateStr = date.toISOString().split("T")[0];

  return useQuery<AstronomyData>({
    queryKey: ["astronomy", location.lat, location.lng, dateStr],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astronomy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ lat: location.lat, lng: location.lng, date: dateStr }),
        }
      );
      if (!res.ok) throw new Error("Astronomy fetch failed");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}
