import { useAstronomyData, PlanetData } from "@/hooks/useAstronomyData";
import { motion } from "framer-motion";
import { Globe, Loader2 } from "lucide-react";

const PLANET_ICONS: Record<string, string> = {
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
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
        <div className="space-y-2">
          {entries.map(([name, planet], i) => (
            <PlanetRow key={name} name={name} planet={planet} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanetRow = ({ name, planet, index }: { name: string; planet: PlanetData; index: number }) => {
  const icon = PLANET_ICONS[name] ?? "🪐";
  const isVisible = planet.transitAlt != null && planet.transitAlt > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          {planet.magnitude != null && <span>mag {planet.magnitude.toFixed(1)}</span>}
          {planet.constellation && <span>· {planet.constellation}</span>}
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
          <span className="text-[10px] text-muted-foreground">Not visible</span>
        )}
      </div>
    </motion.div>
  );
};

export default PlanetsTonight;
