import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useObservation } from "@/contexts/ObservationContext";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { calculateAltitude } from "@/lib/visibility";
import { getObjectRiseSetTransit, RiseSetTransit } from "@/lib/rise-set";
import { getMoonPhaseInfo } from "@/lib/moon-phase";
import { Loader2, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import TonightTargetCard from "./TonightTargetCard";

export interface RankedTarget {
  obj: CelestialObject;
  alt: number;
  rs: RiseSetTransit;
  score: number;
}

interface TonightTargetListProps {
  sessionIds: string[];
  onAddToSession: (catalogId: string) => void;
}

const TonightTargetList = ({ sessionIds, onAddToSession }: TonightTargetListProps) => {
  const { location, date } = useObservation();
  const moon = getMoonPhaseInfo(date);

  const { data: objects, isLoading } = useQuery({
    queryKey: ["tonight-targets", location.lat, location.lng, date.toDateString()],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .gte("photo_score", 4)
        .not("ra_deg", "is", null)
        .not("dec_deg", "is", null)
        .order("photo_score", { ascending: false })
        .limit(300);
      return (data ?? []) as CelestialObject[];
    },
    staleTime: 120_000,
  });

  const ranked = useMemo<RankedTarget[]>(() => {
    if (!objects) return [];

    // Calculate LST at midnight for RA filtering
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1); // next day midnight
    const JD = midnight.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525.0;
    let GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T;
    GMST = ((GMST % 360) + 360) % 360;
    const LST = ((GMST + location.lng) % 360 + 360) % 360;

    return objects
      .filter((obj) => {
        // Filter by RA within ±90° of LST at midnight
        const ra = obj.ra_deg!;
        let diff = Math.abs(ra - LST);
        if (diff > 180) diff = 360 - diff;
        return diff <= 90;
      })
      .map((obj) => {
        const alt = calculateAltitude(obj.ra_deg!, obj.dec_deg!, location.lat, location.lng, date);
        const rs = getObjectRiseSetTransit(obj.ra_deg!, obj.dec_deg!, location.lat, location.lng, date);

        let score = (obj.photo_score ?? 0) * 2;
        // Moon tolerance bonus
        if (moon.illumination > 50 && (obj.moon_tolerance ?? 0) >= 3) score += 2;
        // Altitude bonus
        if (rs.transitAlt > 60) score += 2;
        else if (rs.transitAlt > 50) score += 1;

        return { obj, alt, rs, score };
      })
      .filter((item) => !item.rs.neverRises)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [objects, location.lat, location.lng, date, moon.illumination]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">✨ Tonight's Best Targets</h2>
        <span className="text-xs text-muted-foreground">{ranked.length} targets</span>
      </div>

      {moon.illumination > 60 && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Bright Moon Tonight ({moon.illumination}%) — Narrowband and high moon-tolerance targets are prioritized
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ranked.map((item, i) => (
          <TonightTargetCard
            key={item.obj.id}
            obj={item.obj}
            rs={item.rs}
            alt={item.alt}
            moonIllumination={moon.illumination}
            isInSession={sessionIds.includes(item.obj.catalog_id)}
            onAddToSession={() => onAddToSession(item.obj.catalog_id)}
            index={i}
          />
        ))}
      </div>

      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No targets visible tonight from this location.</p>
      )}
    </div>
  );
};

export default TonightTargetList;
