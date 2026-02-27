import { CelestialObject } from "@/hooks/useCelestialObjects";
import { getMoonPhase } from "@/lib/astronomy";
import { Wrench, Moon, Focus, Info, Shield, AlertTriangle, CheckCircle2, Telescope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  obj: CelestialObject;
  userFocalLength?: number;
}

const SetupAssistant = ({ obj, userFocalLength = 0 }: Props) => {
  const moon = getMoonPhase();

  // Moon impact analysis based on moon_tolerance (1 = very sensitive, 5 = very tolerant)
  const tolerance = obj.moon_tolerance ?? 3;
  const moonIllum = moon.illumination;

  const getMoonImpact = () => {
    // High tolerance (4-5) = narrowband-friendly, low sensitivity
    // Low tolerance (1-2) = broadband, very sensitive
    if (tolerance >= 4 || moonIllum < 20) {
      return {
        level: "low" as const,
        color: "text-accent",
        bgColor: "bg-accent/10 border-accent/20",
        icon: <CheckCircle2 className="w-4 h-4" />,
        message: "Moonlight shouldn't affect this target much. Ideal for narrowband imaging.",
      };
    }
    if (tolerance >= 2 && moonIllum < 60) {
      return {
        level: "medium" as const,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10 border-orange-400/20",
        icon: <AlertTriangle className="w-4 h-4" />,
        message: "Best captured with a filter or during moonset. Consider narrowband if available.",
      };
    }
    return {
      level: "high" as const,
      color: "text-destructive",
      bgColor: "bg-destructive/10 border-destructive/20",
      icon: <Shield className="w-4 h-4" />,
      message: "Broadband target: Very sensitive to moonlight. Recommended during New Moon.",
    };
  };

  const moonImpact = getMoonImpact();

  // Setup compatibility check
  const getSetupCompatibility = () => {
    if (!userFocalLength || !obj.ideal_resolution) return null;

    const resolution = obj.ideal_resolution.toLowerCase();
    let idealMin = 0;
    let idealMax = 0;

    if (resolution.includes("wide") || resolution.includes("short")) {
      idealMin = 200; idealMax = 600;
    } else if (resolution.includes("medium") || resolution.includes("mid")) {
      idealMin = 500; idealMax = 1200;
    } else if (resolution.includes("long") || resolution.includes("high")) {
      idealMin = 1000; idealMax = 3000;
    } else {
      // Try to parse a number from the string
      const match = resolution.match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        idealMin = val * 0.6;
        idealMax = val * 1.5;
      } else {
        return null;
      }
    }

    if (userFocalLength >= idealMin && userFocalLength <= idealMax) {
      return {
        match: "great" as const,
        color: "text-accent",
        message: "Great match for your focal length! Your setup should frame this target well.",
      };
    }
    if (userFocalLength < idealMin) {
      return {
        match: "short" as const,
        color: "text-orange-400",
        message: "This target is relatively small; you might benefit from a Barlow lens or a longer focal length for finer details.",
      };
    }
    return {
      match: "long" as const,
      color: "text-primary",
      message: "Your focal length may frame only part of this object. Consider a focal reducer for a wider field of view.",
    };
  };

  const setupCompat = getSetupCompatibility();

  const hasAnyData = obj.recommended_filter || obj.ideal_resolution || obj.moon_tolerance != null;
  if (!hasAnyData && !userFocalLength) return null;

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border/50 bg-secondary/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/30">
          <Wrench className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Setup Assistant</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
            Recommendations
          </Badge>
        </div>

        <div className="p-4 space-y-4">
          {/* Gear & Filters */}
          {(obj.recommended_filter || obj.ideal_resolution) && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Focus className="w-3.5 h-3.5" /> Gear & Filters
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {obj.recommended_filter && (
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Suggested Filter</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                          Filters help contrast, but results vary based on your camera type (Mono vs Color).
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm font-medium text-foreground">{obj.recommended_filter}</p>
                  </div>
                )}

                {obj.ideal_resolution && (
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Suggested Focal Length</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                          Based on the object's angular size to ensure good framing.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm font-medium text-foreground">{obj.ideal_resolution}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smart Moon Warning */}
          {obj.moon_tolerance != null && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" /> Moon Impact Assessment
              </h5>
              <div className={`p-3 rounded-lg border ${moonImpact.bgColor} flex items-start gap-3`}>
                <div className={`mt-0.5 ${moonImpact.color}`}>{moonImpact.icon}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase ${moonImpact.color}`}>
                      {moonImpact.level} impact
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {moon.emoji} {moon.illumination}% illuminated · Tolerance {tolerance}/5
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{moonImpact.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Setup Compatibility */}
          {setupCompat && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Telescope className="w-3.5 h-3.5" /> Setup Compatibility
              </h5>
              <div className="p-3 rounded-lg bg-card/50 border border-border/30 flex items-start gap-3">
                <div className={`mt-0.5 ${setupCompat.color}`}>
                  {setupCompat.match === "great" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className={`text-xs font-medium ${setupCompat.color}`}>
                    Your setup: {userFocalLength}mm
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{setupCompat.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-3">
            Equipment suggestions are based on standard astronomical baselines. Your specific local conditions and camera sensor may yield different results.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SetupAssistant;
