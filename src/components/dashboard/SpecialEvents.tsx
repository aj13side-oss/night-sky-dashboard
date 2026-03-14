import { getMeteorShowers, getAuroraForecast } from "@/lib/celestial-data";
import { motion } from "framer-motion";
import { Zap, Sun } from "lucide-react";

const SpecialEvents = () => {
  const showers = getMeteorShowers();
  const aurora = getAuroraForecast();

  const hasContent = showers.length > 0 || aurora.length > 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">☄️ Special Events</h3>
      </div>

      {!hasContent && (
        <p className="text-xs text-muted-foreground text-center py-4">No special events this week</p>
      )}

      {/* Meteor Showers */}
      {showers.slice(0, 3).map((shower, i) => (
        <motion.div
          key={shower.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-2.5 rounded-xl bg-secondary/30"
        >
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{shower.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{shower.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  Peak: {shower.peakDate}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  ZHR: {shower.zhr}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {shower.speed} km/s
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Aurora */}
      {aurora.slice(0, 2).map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: (showers.length + i) * 0.05 }}
          className="p-2.5 rounded-xl bg-secondary/30"
        >
          <div className="flex items-start gap-2">
            <Sun className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{a.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
              <div className="flex gap-1.5 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                  Kp {a.kpIndex}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {a.probability}% chance
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SpecialEvents;
