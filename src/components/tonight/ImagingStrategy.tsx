import { getMoonPhaseInfo } from "@/lib/moon-phase";
import { useObservation } from "@/contexts/ObservationContext";
import { RankedTarget } from "./TonightTargetList";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface ImagingStrategyProps {
  targets: RankedTarget[];
  avgCloudCover: number | null;
  bestClearHour: string | null;
}

const ImagingStrategy = ({ targets, avgCloudCover, bestClearHour }: ImagingStrategyProps) => {
  const { date } = useObservation();
  const moon = getMoonPhaseInfo(date);

  const top3 = targets.slice(0, 3).map((t) => t.obj.common_name || t.obj.catalog_id);
  const top3MoonTol = targets
    .filter((t) => (t.obj.moon_tolerance ?? 0) >= 3)
    .slice(0, 3)
    .map((t) => t.obj.common_name || t.obj.catalog_id);

  let message: string;
  let icon = "🔭";

  if (avgCloudCover !== null && avgCloudCover > 70) {
    icon = "☁️";
    message = `Heavy cloud cover expected (${Math.round(avgCloudCover)}%).${bestClearHour ? ` Watch for clearing around ${bestClearHour}.` : " Consider postponing."}`;
  } else if (moon.illumination < 30) {
    icon = "🌟";
    message = `Excellent conditions for broadband RGB imaging. Top picks: ${top3.join(", ")}.`;
  } else if (moon.illumination <= 60) {
    icon = "🌓";
    message = `Moderate moonlight (${moon.illumination}%) — consider dual-band or high moon-tolerance targets. Best bets: ${(top3MoonTol.length > 0 ? top3MoonTol : top3).join(", ")}.`;
  } else {
    icon = "🌕";
    message = `Strong moonlight (${moon.illumination}%). Focus on narrowband SHO or planetary imaging. Recommended: ${(top3MoonTol.length > 0 ? top3MoonTol : top3).join(", ")}.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-4 border-l-4 border-l-primary"
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{icon} Imaging Strategy</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ImagingStrategy;
