interface Props {
  objectSizeArcmin: number;
  focalLength: number;
  sensorWidth: number;
  sensorHeight: number;
}

const FovOverlay = ({ objectSizeArcmin, focalLength, sensorWidth, sensorHeight }: Props) => {
  if (focalLength <= 0 || sensorWidth <= 0 || sensorHeight <= 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        Configure your equipment in{" "}
        <span className="text-primary">FOV Calculator</span> to see framing
      </div>
    );
  }

  const fovWDeg = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
  const fovHDeg = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
  const fovWArcmin = fovWDeg * 60;
  const fovHArcmin = fovHDeg * 60;

  const objFractionW = objectSizeArcmin / fovWArcmin;
  const objFractionH = objectSizeArcmin / fovHArcmin;
  const aspectRatio = fovHDeg / fovWDeg;

  const framingPct = Math.round(objFractionW * 100);
  const framingLabel =
    framingPct < 10 ? "Very small — consider more focal length"
    : framingPct < 30 ? "Small — good for context"
    : framingPct < 70 ? "Well framed ✓"
    : framingPct < 100 ? "Fills most of the frame"
    : "Larger than sensor — mosaic needed";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>FOV: {fovWArcmin.toFixed(0)}' × {fovHArcmin.toFixed(0)}'</span>
        <span className="font-mono">{framingPct}% of width</span>
      </div>
      <div
        className="relative bg-muted/20 rounded-lg border border-border/30 overflow-hidden"
        style={{ paddingBottom: `${aspectRatio * 100}%`, minHeight: 80 }}
      >
        <div className="absolute inset-0 border border-primary/30 rounded-lg" />
        {/* Crosshair */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/20" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />
        {/* Object circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/60 bg-accent/10"
          style={{
            width: `${Math.min(objFractionW * 100, 200)}%`,
            paddingBottom: `${Math.min(objFractionH * 100, 200)}%`,
          }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">{framingLabel}</p>
    </div>
  );
};

export default FovOverlay;
