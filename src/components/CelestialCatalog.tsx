import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useObservation } from "@/contexts/ObservationContext";
import {
  getPlanets,
  getDeepSkyObjects,
  getAsteroids,
  getMeteorShowers,
  getAuroraForecast,
} from "@/lib/celestial-data";
import { motion } from "framer-motion";
import { Globe, Sparkles, CircleDot, Zap, Sun } from "lucide-react";

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/20 text-green-400";
  if (d === "Medium") return "bg-primary/20 text-primary";
  return "bg-red-500/20 text-red-400";
};

const CelestialCatalog = () => {
  const { date } = useObservation();
  const month = date.getMonth();
  const planets = getPlanets(month);
  const deepsky = getDeepSkyObjects(month);
  const asteroids = getAsteroids(month);
  const showers = getMeteorShowers();
  const aurora = getAuroraForecast();

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Celestial Objects Catalog
      </h3>

      <Tabs defaultValue="planets" className="w-full">
        <TabsList className="w-full bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="planets" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Globe className="w-3 h-3" /> Planets
          </TabsTrigger>
          <TabsTrigger value="deepsky" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Sparkles className="w-3 h-3" /> Deep Sky
          </TabsTrigger>
          <TabsTrigger value="asteroids" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <CircleDot className="w-3 h-3" /> Asteroids
          </TabsTrigger>
          <TabsTrigger value="showers" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Zap className="w-3 h-3" /> Meteor Showers
          </TabsTrigger>
          <TabsTrigger value="auroras" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Sun className="w-3 h-3" /> Auroras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planets" className="mt-4 space-y-2">
          {planets.map((obj, i) => (
            <ObjectRow key={obj.id} obj={obj} index={i} />
          ))}
        </TabsContent>

        <TabsContent value="deepsky" className="mt-4 space-y-2">
          {deepsky.map((obj, i) => (
            <ObjectRow key={obj.id} obj={obj} index={i} />
          ))}
        </TabsContent>

        <TabsContent value="asteroids" className="mt-4 space-y-2">
          {asteroids.map((obj, i) => (
            <ObjectRow key={obj.id} obj={obj} index={i} />
          ))}
        </TabsContent>

        <TabsContent value="showers" className="mt-4 space-y-2">
          {showers.map((shower, i) => (
            <motion.div
              key={shower.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {shower.imagePath ? (
                  <img src={shower.imagePath} alt={shower.name} className="w-full h-full object-cover" />
                ) : (
                  <Zap className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{shower.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{shower.description}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    Peak: {shower.peakDate}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                    ZHR: {shower.zhr}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {shower.speed} km/s · {shower.radiant}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="auroras" className="mt-4 space-y-2">
          {aurora.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {a.imagePath ? (
                  <img src={a.imagePath} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <Sun className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                    Kp {a.kpIndex}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                    {a.probability}% chance
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {a.bestLatitude}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ObjectRow = ({ obj, index }: { obj: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
  >
    <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
      {obj.imagePath ? (
        <img src={obj.imagePath} alt={obj.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs text-muted-foreground font-mono">IMG</span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{obj.name}</p>
      <p className="text-xs text-muted-foreground truncate">
        {obj.type} · {obj.constellation} · mag {obj.magnitude}
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {!obj.visible && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Not visible
        </span>
      )}
      {obj.visible && (
        <>
          <span className="font-mono text-xs text-muted-foreground">{obj.bestTime}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColor(obj.difficulty)}`}>
            {obj.difficulty}
          </span>
        </>
      )}
    </div>
  </motion.div>
);

export default CelestialCatalog;
