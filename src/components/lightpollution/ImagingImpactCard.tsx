import { useState } from "react";
import { BORTLE_MULTIPLIERS } from "@/lib/dark-sites";
import { Camera, Telescope } from "lucide-react";

const BORTLE_COLORS: Record<number, string> = {
  1: "#000000", 2: "#1a1a2e", 3: "#16213e", 4: "#0f3460",
  5: "#533483", 6: "#e94560", 7: "#ff6b35", 8: "#ff9f1c", 9: "#ffffff",
};

interface Props {
  selectedBortle?: number;
}

const ImagingImpactCard = ({ selectedBortle }: Props) => {
  const [bortle, setBortle] = useState(selectedBortle ?? 5);

  const current = BORTLE_MULTIPLIERS[bortle];
  const baseExposure = 60; // 60s subs at Bortle 1
  const adjustedSubs = Math.round(baseExposure * current.multiplier);

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Imaging Impact Calculator</h3>
      </div>

      {/* Bortle Selector */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
          <button
            key={b}
            onClick={() => setBortle(b)}
            className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all border ${
              bortle === b
                ? "ring-2 ring-primary scale-110 z-10"
                : "border-border/30 opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: BORTLE_COLORS[b],
              color: b >= 7 ? "hsl(230 25% 7%)" : "hsl(210 40% 92%)",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Multiplier</p>
          <p className="text-lg font-bold font-mono text-foreground">×{current.multiplier}</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Limiting Mag</p>
          <p className="text-lg font-bold font-mono text-foreground">{current.limitingMag}</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Equiv. Subs</p>
          <p className="text-lg font-bold font-mono text-foreground">{adjustedSubs}×</p>
          <p className="text-[9px] text-muted-foreground">60s each</p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/20">
              <th className="text-left p-2 text-muted-foreground font-medium">Bortle</th>
              <th className="text-center p-2 text-muted-foreground font-medium">×</th>
              <th className="text-center p-2 text-muted-foreground font-medium">Lim. Mag</th>
              <th className="text-right p-2 text-muted-foreground font-medium">Total (60s)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(BORTLE_MULTIPLIERS).map(([b, data]) => (
              <tr
                key={b}
                className={`border-t border-border/10 transition-colors ${
                  Number(b) === bortle ? "bg-primary/10" : ""
                }`}
              >
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BORTLE_COLORS[Number(b)] }} />
                    <span className={Number(b) === bortle ? "font-bold text-foreground" : "text-muted-foreground"}>
                      B{b}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-center font-mono text-foreground">×{data.multiplier}</td>
                <td className="p-2 text-center font-mono text-foreground">{data.limitingMag}</td>
                <td className="p-2 text-right font-mono text-foreground">{Math.round(60 * data.multiplier)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Multiplier = extra integration time vs Bortle 1 to reach equivalent SNR. Based on sky brightness ratios.
      </p>
    </div>
  );
};

export default ImagingImpactCard;
