import { getTonightObjects, type CelestialObject } from "@/lib/astronomy";
import { motion } from "framer-motion";

const difficultyColor = (d: CelestialObject["difficulty"]) => {
  if (d === "Easy") return "bg-green-500/20 text-green-400";
  if (d === "Medium") return "bg-primary/20 text-primary";
  return "bg-red-500/20 text-red-400";
};

const typeIcon = (t: CelestialObject["type"]) => {
  switch (t) {
    case "Galaxy": return "🌀";
    case "Nebula": return "🟣";
    case "Cluster": return "✨";
    case "Planet": return "🪐";
    case "Double Star": return "⭐";
  }
};

const CelestialObjectsCard = () => {
  const objects = getTonightObjects();

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tonight's Objects</h3>
      
      <div className="space-y-2">
        {objects.map((obj, i) => (
          <motion.div
            key={obj.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="text-lg">{typeIcon(obj.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{obj.name}</p>
              <p className="text-xs text-muted-foreground">{obj.constellation} · mag {obj.magnitude}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-muted-foreground">{obj.bestTime}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColor(obj.difficulty)}`}>
                {obj.difficulty}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CelestialObjectsCard;
