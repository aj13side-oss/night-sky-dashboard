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
import { useTranslation } from "react-i18next";

interface Props {
  obj: CelestialObject;
  userFocalLength?: number;
}

// Best-effort localisation of common DB values coming from `ideal_resolution`
// and `recommended_filter`. Unknown values pass through as-is.
function localiseResolution(value: string, t: (k: string, opts?: any) => string): string {
  const v = value.toLowerCase();
  if (/(200|400|wide|short|grand|court)/.test(v)) return t("modal.resolution.wide", { defaultValue: value });
  if (/(500|600|800|1000|1200|medium|mid|moyen)/.test(v)) return t("modal.resolution.medium", { defaultValue: value });
  if (/(1500|1800|2000|3000|long|high|longue)/.test(v)) return t("modal.resolution.long", { defaultValue: value });
  return value;
}
function localiseFilter(value: string, t: (k: string, opts?: any) => string): string {
  const v = value.toLowerCase();
  if (v.includes("dual")) return t("modal.filter.dualBand", { defaultValue: value });
  if (v.includes("narrow") || /(ha|sii|oiii|s-ii|o-iii)/.test(v)) return t("modal.filter.narrowband", { defaultValue: value });
  if (v.includes("l-pro") || v.includes("lpro") || v.includes("pollut")) return t("modal.filter.lpro", { defaultValue: value });
  if (v.includes("broad") || v.includes("uv") || v.includes("ir") || v.includes("large")) return t("modal.filter.broadband", { defaultValue: value });
  return value;
}

const SetupAssistant = ({ obj, userFocalLength = 0 }: Props) => {
  const { t } = useTranslation("object");
  const moon = getMoonPhase();

  // Moon impact analysis based on moon_tolerance (1 = very sensitive, 5 = very tolerant)
  const tolerance = obj.moon_tolerance ?? 3;
  const moonIllum = moon.illumination;

  const getMoonImpact = () => {
    if (tolerance >= 4 || moonIllum < 20) {
      return {
        level: t("modal.impactLow"),
        color: "text-accent",
        bgColor: "bg-accent/10 border-accent/20",
        icon: <CheckCircle2 className="w-4 h-4" />,
        message: t("modal.moonLow"),
      };
    }
    if (tolerance >= 2 && moonIllum < 60) {
      return {
        level: t("modal.impactMedium"),
        color: "text-orange-400",
        bgColor: "bg-orange-400/10 border-orange-400/20",
        icon: <AlertTriangle className="w-4 h-4" />,
        message: t("modal.moonMedium"),
      };
    }
    return {
      level: t("modal.impactHigh"),
      color: "text-destructive",
      bgColor: "bg-destructive/10 border-destructive/20",
      icon: <Shield className="w-4 h-4" />,
      message: t("modal.moonHigh"),
    };
  };

  const moonImpact = getMoonImpact();

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
      return { match: "great" as const, color: "text-accent", message: t("modal.compatGreat") };
    }
    if (userFocalLength < idealMin) {
      return { match: "short" as const, color: "text-orange-400", message: t("modal.compatShort") };
    }
    return { match: "long" as const, color: "text-primary", message: t("modal.compatLong") };
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
          <span className="text-sm font-semibold text-foreground">{t("modal.setupAssistant")}</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
            {t("modal.recommendations")}
          </Badge>
        </div>

        <div className="p-4 space-y-4">
          {/* Gear & Filters */}
          {(obj.recommended_filter || obj.ideal_resolution) && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Focus className="w-3.5 h-3.5" /> {t("modal.gearFilters")}
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {obj.recommended_filter && (
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{t("modal.suggestedFilter")}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                          {t("modal.filterTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm font-medium text-foreground">{localiseFilter(obj.recommended_filter, t)}</p>
                  </div>
                )}

                {obj.ideal_resolution && (
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{t("modal.suggestedFocalLength")}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                          {t("modal.focalTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm font-medium text-foreground">{localiseResolution(obj.ideal_resolution, t)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smart Moon Warning */}
          {obj.moon_tolerance != null && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" /> {t("modal.moonImpactAssessment")}
              </h5>
              <div className={`p-3 rounded-lg border ${moonImpact.bgColor} flex items-start gap-3`}>
                <div className={`mt-0.5 ${moonImpact.color}`}>{moonImpact.icon}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase ${moonImpact.color}`}>
                      {moonImpact.level}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {moon.emoji} {moon.illumination}% {t("modal.illuminated")} · {t("modal.tolerance")} {tolerance}/5
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
                <Telescope className="w-3.5 h-3.5" /> {t("modal.setupCompatibility")}
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
                    {t("modal.yourSetup", { fl: userFocalLength })}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{setupCompat.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-3">
            {t("modal.assistantDisclaimer")}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SetupAssistant;
