import { useAstronomyData, PlanetData } from "@/hooks/useAstronomyData";
import { useSolarSystemObjects } from "@/hooks/useSolarSystemObjects";
import { motion } from "framer-motion";
import { Globe, Loader2 } from "lucide-react";
import type { SolarSystemObject } from "@/hooks/useSolarSystemObjects";

const PlanetsTonight = () => {
  const { data, isLoading } = useAstronomyData();
  const { data: solarObjects } = useSolarSystemObjects();
  const planets = data?.planets;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entries = planets
    ? Object.entries(planets).filter(([, p]) => p.rise || p.transit)
    : [];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">🪐 Planets Tonight</h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No planet data available</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map(([name, planet], i) => (
            <PlanetRow key={name} name={name} planet={planet} index={i} solarObjects={solarObjects} />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanetRow = ({ name, planet, index, solarObjects }: { name: string; planet: PlanetData; index: number; solarObjects?: SolarSystemObject[] }) => {
  const isVisible = planet.transitAlt != null && planet.transitAlt > 0;
  const hasRise = !!planet.rise;
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const ssoMatch = solarObjects?.find(o => o.name.toLowerCase() === name.toLowerCase());

  let statusDot: string;
  let statusText: string;

  if (isVisible) {
    statusDot = "bg-green-400";
    statusText = "Visible";
  } else if (hasRise) {
    statusDot = "bg-yellow-400";
    statusText = `Rises ${planet.rise}`;
  } else {
    statusDot = "bg-muted-foreground/40";
    statusText = "Not visible";
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      {ssoMatch?.image_url ? (
        <img
          src={ssoMatch.image_url}
          alt={displayName}
          className="w-7 h-7 rounded-full object-cover shrink-0"
        />
      ) : (
        <span className="text-lg w-7 text-center">🪐</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-[10px] text-muted-foreground">{statusText}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          {planet.magnitude != null && <span>mag {planet.magnitude.toFixed(1)}</span>}
          {planet.constellation && <span>· {planet.constellation}</span>}
          {planet.transit && <span>· Transit {planet.transit}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        {isVisible ? (
          <>
            <p className="text-xs font-mono text-foreground">
              {planet.transitAlt?.toFixed(0)}° max
            </p>
            <div className="text-[10px] text-muted-foreground">
              {planet.rise && <span>↑{planet.rise}</span>}
              {planet.set && <span> ↓{planet.set}</span>}
            </div>
          </>
        ) : (
          <div className="text-[10px] text-muted-foreground">
            {planet.rise && <span>↑{planet.rise}</span>}
            {planet.set && <span> ↓{planet.set}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlanetsTonight;
