import { useMemo } from "react";

interface SamplingGaugeProps {
  sampling: number;
}

const ZONES = [
  { label: "Planetary", min: 0, max: 0.5, color: "hsl(var(--destructive))" },
  { label: "Oversampled", min: 0.5, max: 1.0, color: "hsl(var(--accent))" },
  { label: "Sweet Spot", min: 1.0, max: 2.0, color: "hsl(142 71% 45%)" },
  { label: "Undersampled", min: 2.0, max: 3.0, color: "hsl(var(--accent))" },
  { label: "Widefield", min: 3.0, max: 5.0, color: "hsl(var(--destructive))" },
];

const SEEING_CONDITIONS = [
  { seeing: 1.0, label: '1.0″ (excellent)' },
  { seeing: 2.0, label: '2.0″ (bon)' },
  { seeing: 3.0, label: '3.0″ (moyen)' },
  { seeing: 4.0, label: '4.0″ (mauvais)' },
];

function getSeeingStatus(sampling: number, seeing: number): { status: "ok" | "warning"; note: string } {
  const nyquistLow = seeing / 3;
  const nyquistHigh = seeing / 2;
  if (sampling >= nyquistLow && sampling <= nyquistHigh) {
    return { status: "ok", note: "Résolution maximale exploitée" };
  }
  if (sampling < nyquistLow) {
    return { status: "warning", note: "Sur-échantillonné — le seeing sera le facteur limitant" };
  }
  return { status: "warning", note: "Sous-échantillonné — résolution limitée par le seeing" };
}

function getSamplingDescription(sampling: number): string {
  if (sampling < 0.5) return `${sampling.toFixed(2)}″/px — Planétaire / sur-échantillonné pour le ciel profond`;
  if (sampling < 1.0) return `${sampling.toFixed(2)}″/px — Sur-échantillonné, sensible au seeing`;
  if (sampling < 2.0) return `${sampling.toFixed(2)}″/px — Idéal pour le ciel profond sous seeing moyen (2-3″)`;
  if (sampling < 3.0) return `${sampling.toFixed(2)}″/px — Sous-échantillonné, risque de pixelisation`;
  return `${sampling.toFixed(2)}″/px — Très large champ, étoiles pixelisées`;
}

export function SamplingGauge({ sampling }: SamplingGaugeProps) {
  const clampedSampling = Math.min(sampling, 5);
  const percentage = (clampedSampling / 5) * 100;

  const relevantSeeing = useMemo(() => {
    return SEEING_CONDITIONS.map(s => ({
      ...s,
      ...getSeeingStatus(sampling, s.seeing),
    }));
  }, [sampling]);

  return (
    <div className="space-y-4">
      {/* Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0″/px</span>
          <span className="text-foreground font-semibold">{sampling.toFixed(2)}″/px</span>
          <span>5″/px</span>
        </div>
        <div className="relative h-6 rounded-full overflow-hidden flex">
          {ZONES.map((zone) => {
            const width = ((zone.max - zone.min) / 5) * 100;
            return (
              <div
                key={zone.label}
                className="h-full relative flex items-center justify-center"
                style={{ width: `${width}%`, backgroundColor: zone.color, opacity: 0.3 }}
              >
                <span className="text-[8px] font-medium text-foreground/70 whitespace-nowrap select-none">
                  {zone.label}
                </span>
              </div>
            );
          })}
          {/* Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-lg"
            style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-md" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">{getSamplingDescription(sampling)}</p>
      </div>

      {/* Seeing comparison table */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-foreground">Conditions de seeing</h4>
        <div className="grid grid-cols-1 gap-1">
          {relevantSeeing.map(s => (
            <div key={s.seeing} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-muted/30">
              <span className="w-24 text-muted-foreground font-mono">{s.label}</span>
              <span className={s.status === "ok" ? "text-green-500" : "text-amber-500"}>
                {s.status === "ok" ? "✅" : "⚠️"}
              </span>
              <span className="text-muted-foreground flex-1">{s.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
