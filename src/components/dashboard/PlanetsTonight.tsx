import { useAstronomyData, PlanetData } from "@/hooks/useAstronomyData";
import { motion } from "framer-motion";
import { Globe, Loader2 } from "lucide-react";

const PLANET_COLORS: Record<string, { bg: string; ring?: boolean }> = {
  Mercury: { bg: "#a0a0a0" },
  Venus: { bg: "#f5e6b8" },
  Mars: { bg: "#c1440e" },
  Jupiter: { bg: "#c88b3a" },
  Saturn: { bg: "#e8d191", ring: true },
  Uranus: { bg: "#73c2c6" },
  Neptune: { bg: "#3f54ba" },
};

const PlanetIcon = ({ name }: { name: string }) => {
  const config = PLANET_COLORS[name];
  if (!config) return <span className="text-lg w-7 text-center">🪐</span>;

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0">
      <circle cx="12" cy="12" r="8" fill={config.bg} />
      {config.ring && (
        <ellipse cx="12" cy="12" rx="12" ry="4" fill="none" stroke={config.bg} strokeWidth="1.5" opacity="0.6" transform="rotate(-20 12 12)" />
      )}
    </svg>
  );
};

const PlanetsTonight = () => {
  const { data, isLoading } = useAstronomyData();
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
            <PlanetRow key={name} name={name} planet={planet} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanetRow = ({ name, planet, index }: { name: string; planet: PlanetData; index: number }) => {
  const isVisible = planet.transitAlt != null && planet.transitAlt > 0;
  const hasRise = !!planet.rise;

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
      <PlanetIcon name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{name}</p>
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
