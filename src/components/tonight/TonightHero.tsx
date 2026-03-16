import { useObservation } from "@/contexts/ObservationContext";
import { useAstronomyData } from "@/hooks/useAstronomyData";
import { getMoonPhaseInfo } from "@/lib/moon-phase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Moon, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface TonightHeroProps {
  onChangeLocation: () => void;
  observationScore: number | null;
}

const TonightHero = ({ onChangeLocation, observationScore }: TonightHeroProps) => {
  const { date, location } = useObservation();
  const { data: astro } = useAstronomyData();
  const moon = getMoonPhaseInfo(date);

  const darkStart = astro?.sun?.astronomicalTwilightEnd ?? "21:30";
  const darkEnd = astro?.sun?.astronomicalTwilightBegin ?? "05:00";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl star-field"
      style={{ background: "linear-gradient(135deg, hsl(230 25% 7%), hsl(230 30% 12%), hsl(220 25% 8%))" }}
    >
      <div className="relative z-10 px-6 py-8 sm:py-10 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Tonight's Sky
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location.name}</span>
          <Button variant="ghost" size="sm" onClick={onChangeLocation} className="text-xs h-6 px-2 text-primary">
            Change
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-3">
            <Moon className="w-3 h-3" />
            {moon.emoji} {moon.name} — {moon.illumination}%
          </Badge>

          {observationScore !== null && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-3"
              style={{
                borderColor: observationScore >= 65 ? "hsl(142 71% 45% / 0.3)" : observationScore >= 40 ? "hsl(45 93% 47% / 0.3)" : "hsl(0 84% 60% / 0.3)",
              }}
            >
              <Star className="w-3 h-3" />
              Score: {observationScore}/100
            </Badge>
          )}

          <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-3">
            <Clock className="w-3 h-3" />
            Dark: {darkStart} → {darkEnd}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default TonightHero;
