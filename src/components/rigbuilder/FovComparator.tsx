import { useMemo } from "react";

interface FovComparatorProps {
  fovWArcmin: number;
  fovHArcmin: number;
}

const TARGETS = [
  { name: "Lune", w: 31, h: 31, shape: "circle" as const },
  { name: "M31 Andromeda", w: 178, h: 63, shape: "ellipse" as const },
  { name: "M42 Orion", w: 85, h: 60, shape: "ellipse" as const },
  { name: "M45 Pléiades", w: 110, h: 110, shape: "circle" as const },
  { name: "NGC 7000", w: 120, h: 100, shape: "ellipse" as const },
  { name: "M81", w: 26, h: 14, shape: "ellipse" as const },
  { name: "M1 Crab", w: 7, h: 5, shape: "ellipse" as const },
  { name: "M57 Ring", w: 1.4, h: 1.0, shape: "ellipse" as const },
];

type Fit = "full" | "partial" | "none";

function getFit(targetW: number, targetH: number, fovW: number, fovH: number): Fit {
  if (targetW <= fovW && targetH <= fovH) return "full";
  if (targetW <= fovW * 2 && targetH <= fovH * 2) return "partial";
  return "none";
}

const FIT_COLORS: Record<Fit, string> = {
  full: "hsl(142 71% 45%)",
  partial: "hsl(var(--accent))",
  none: "hsl(var(--destructive))",
};

const FIT_LABELS: Record<Fit, string> = {
  full: "✓ Rentre",
  partial: "~ Partiel",
  none: "✗ Trop grand",
};

export function FovComparator({ fovWArcmin, fovHArcmin }: FovComparatorProps) {
  const targetFits = useMemo(() => {
    return TARGETS.map(t => ({
      ...t,
      fit: getFit(t.w, t.h, fovWArcmin, fovHArcmin),
    }));
  }, [fovWArcmin, fovHArcmin]);

  // SVG: show FOV as the container, targets as shapes inside
  const svgW = 300;
  const aspect = fovHArcmin / fovWArcmin;
  const svgH = Math.max(svgW * aspect, 100);
  const scale = svgW / fovWArcmin;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-foreground">
        Votre champ capture… ({fovWArcmin.toFixed(0)}' × {fovHArcmin.toFixed(0)}')
      </h4>

      {/* SVG visual */}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[300px] rounded-lg border border-border/30 bg-muted/10"
          style={{ maxHeight: 200 }}
        >
          {/* FOV rectangle */}
          <rect x={0} y={0} width={svgW} height={svgH} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 2" opacity={0.5} />

          {/* Target shapes */}
          {targetFits.map((t) => {
            const tw = t.w * scale;
            const th = t.h * scale;
            const cx = svgW / 2;
            const cy = svgH / 2;
            const opacity = t.fit === "none" ? 0.15 : t.fit === "partial" ? 0.25 : 0.35;
            const color = FIT_COLORS[t.fit];

            if (tw < 2 || th < 2) return null; // too small to render

            return (
              <g key={t.name}>
                <ellipse
                  cx={cx} cy={cy}
                  rx={Math.min(tw / 2, svgW)}
                  ry={Math.min(th / 2, svgH)}
                  fill={color}
                  opacity={opacity}
                  stroke={color}
                  strokeWidth={0.5}
                />
                {tw > 20 && (
                  <text
                    x={cx} y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(6, Math.min(10, tw / 6))}
                    fill="currentColor"
                    opacity={0.7}
                  >
                    {t.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* List */}
      <div className="grid grid-cols-2 gap-1">
        {targetFits.map(t => (
          <div key={t.name} className="flex items-center gap-1.5 text-[10px]">
            <span style={{ color: FIT_COLORS[t.fit] }}>{FIT_LABELS[t.fit]}</span>
            <span className="text-muted-foreground">{t.name} ({t.w}'×{t.h}')</span>
          </div>
        ))}
      </div>
    </div>
  );
}
