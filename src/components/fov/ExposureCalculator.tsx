import { useMemo, useState } from "react";
import { Clock, Info, AlertTriangle, Layers } from "lucide-react";
import { type TargetObject } from "./TargetObjectPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BORTLE_MULTIPLIERS: Record<string, { label: string; factor: number }> = {
  "1-2": { label: "Bortle 1–2 (Pristine)", factor: 1 },
  "3-4": { label: "Bortle 3–4 (Rural)", factor: 2 },
  "5-6": { label: "Bortle 5–6 (Suburban)", factor: 4 },
  "7-8": { label: "Bortle 7–8+ (Urban)", factor: 10 },
};

interface Props {
  target: TargetObject | null;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const ExposureCalculator = ({ target }: Props) => {
  const [bortle, setBortle] = useState("3-4");
  const [useNarrowband, setUseNarrowband] = useState(false);

  const exposure = useMemo(() => {
    if (!target || (target.exposureFast == null && target.exposureDeep == null)) return null;
    const mult = BORTLE_MULTIPLIERS[bortle]?.factor ?? 1;
    const nbMult = useNarrowband ? 3 : 1;
    return {
      fast: target.exposureFast != null ? target.exposureFast * mult * nbMult : null,
      deep: target.exposureDeep != null ? target.exposureDeep * mult * nbMult : null,
    };
  }, [target, bortle, useNarrowband]);

  if (!target || !exposure) {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" /> Exposure Guide
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          Select an object from the catalog to see exposure recommendations.
        </p>
      </div>
    );
  }

  const subExpSec = 60;
  const fastSubs = exposure.fast != null ? Math.ceil(exposure.fast / (subExpSec / 60)) : null;
  const deepSubs = exposure.deep != null ? Math.ceil(exposure.deep / (subExpSec / 60)) : null;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Clock className="h-4 w-4" /> Exposure Guide
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            Minimum total integration time recommended under a Bortle 4 sky.
            We recommend taking multiple 30s or 60s sub-exposures and stacking them to reach the total.
          </TooltipContent>
        </Tooltip>
      </h3>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px] space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Sky Quality</label>
          <Select value={bortle} onValueChange={setBortle}>
            <SelectTrigger className="bg-secondary/50 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BORTLE_MULTIPLIERS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setUseNarrowband(!useNarrowband)}
            className={`h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
              useNarrowband
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-secondary/50 border-border text-muted-foreground"
            }`}
          >
            Narrowband (×3)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {exposure.fast != null && (
          <div className="rounded-xl bg-secondary/30 border border-border/30 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              ⚡ Fast Capture
            </p>
            <p className="text-lg font-mono font-semibold text-foreground">
              {formatTime(exposure.fast)}
            </p>
            {fastSubs && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> ~{fastSubs} × {subExpSec}s subs
              </p>
            )}
          </div>
        )}
        {exposure.deep != null && (
          <div className="rounded-xl bg-secondary/30 border border-border/30 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              🔭 Deep Imaging
            </p>
            <p className="text-lg font-mono font-semibold text-foreground">
              {formatTime(exposure.deep)}
            </p>
            {deepSubs && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> ~{deepSubs} × {subExpSec}s subs
              </p>
            )}
          </div>
        )}
      </div>

      {useNarrowband && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
          <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Narrowband filters (Hα/OIII):</span>{" "}
            Exposure times are tripled. These filters are less affected by light pollution but require significantly more integration time.
          </p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60 text-center pt-1 border-t border-border/20">
        These are recommended baselines under standard conditions. Your local sky, sensor sensitivity, and processing workflow may yield different results.
      </p>
    </div>
  );
};

export default ExposureCalculator;
