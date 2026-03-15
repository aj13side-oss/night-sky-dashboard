import { getMeteorShowers, getAuroraForecast, getAsteroids } from "@/lib/celestial-data";
import { motion } from "framer-motion";
import { Zap, Sun, CircleDot } from "lucide-react";

const SpecialEvents = () => {
  const showers = getMeteorShowers();
  const aurora = getAuroraForecast();
  const asteroids = getAsteroids(new Date().getMonth());

  const hasContent = showers.length > 0 || aurora.length > 0 || asteroids.length > 0;

  let animIndex = 0;

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
      {showers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 pt-1">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Meteor Showers</span>
          </div>
          {showers.slice(0, 3).map((shower) => {
            const i = animIndex++;
            return (
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
            );
          })}
        </div>
      )}

      {/* Asteroids / Near-Earth Objects */}
      {asteroids.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 pt-1">
            <CircleDot className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Asteroids</span>
          </div>
          {asteroids.slice(0, 3).map((asteroid) => {
            const i = animIndex++;
            return (
              <motion.div
                key={asteroid.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-2.5 rounded-xl bg-secondary/30"
              >
                <div className="flex items-start gap-2">
                  <CircleDot className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{asteroid.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {asteroid.magnitude != null && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                          mag {asteroid.magnitude.toFixed(1)}
                        </span>
                      )}
                      {asteroid.constellation && (
                        <span className="text-[9px] text-muted-foreground">{asteroid.constellation}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Aurora */}
      {aurora.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 pt-1">
            <Sun className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Aurora Forecast</span>
          </div>
          {aurora.slice(0, 2).map((a) => {
            const i = animIndex++;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecialEvents;
