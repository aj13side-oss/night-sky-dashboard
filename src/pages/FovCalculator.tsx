import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TELESCOPES = [
  { name: "Custom", focalLength: 0, aperture: 0 },
  { name: "Skywatcher 130/900", focalLength: 900, aperture: 130 },
  { name: "Skywatcher 200/1000", focalLength: 1000, aperture: 200 },
  { name: "Celestron C8 (203/2032)", focalLength: 2032, aperture: 203 },
  { name: "Celestron C11 (280/2800)", focalLength: 2800, aperture: 280 },
  { name: "Takahashi FSQ-106 (530)", focalLength: 530, aperture: 106 },
  { name: "William Optics ZS61 (360)", focalLength: 360, aperture: 61 },
  { name: "Skywatcher Evostar 72ED (420)", focalLength: 420, aperture: 72 },
  { name: "Skywatcher Quattro 200P (800)", focalLength: 800, aperture: 200 },
];

const CAMERAS = [
  { name: "Custom", sensorW: 0, sensorH: 0, pixelSize: 0, resW: 0, resH: 0 },
  { name: "ZWO ASI294MC Pro", sensorW: 23.2, sensorH: 15.5, pixelSize: 4.63, resW: 4144, resH: 2822 },
  { name: "ZWO ASI533MC Pro", sensorW: 11.31, sensorH: 11.31, pixelSize: 3.76, resW: 3008, resH: 3008 },
  { name: "ZWO ASI2600MC Pro", sensorW: 23.5, sensorH: 15.7, pixelSize: 3.76, resW: 6248, resH: 4176 },
  { name: "ZWO ASI183MC Pro", sensorW: 13.2, sensorH: 8.8, pixelSize: 2.4, resW: 5496, resH: 3672 },
  { name: "Canon EOS Ra", sensorW: 36.0, sensorH: 24.0, pixelSize: 5.36, resW: 6720, resH: 4480 },
  { name: "Canon EOS 6D", sensorW: 35.8, sensorH: 23.9, pixelSize: 6.55, resW: 5472, resH: 3648 },
  { name: "Nikon D810a", sensorW: 35.9, sensorH: 24.0, pixelSize: 4.88, resW: 7360, resH: 4912 },
  { name: "Sony A7III", sensorW: 35.6, sensorH: 23.8, pixelSize: 5.93, resW: 6000, resH: 4000 },
];

const OBJECTS = [
  { name: "M31 — Andromeda", sizeArcmin: 178 },
  { name: "M42 — Orion Nebula", sizeArcmin: 65 },
  { name: "M45 — Pleiades", sizeArcmin: 110 },
  { name: "M51 — Whirlpool Galaxy", sizeArcmin: 11 },
  { name: "M13 — Hercules Cluster", sizeArcmin: 20 },
  { name: "M57 — Ring Nebula", sizeArcmin: 1.4 },
  { name: "M27 — Dumbbell Nebula", sizeArcmin: 8 },
  { name: "M104 — Sombrero Galaxy", sizeArcmin: 9 },
  { name: "NGC 7000 — North America", sizeArcmin: 120 },
  { name: "Jupiter", sizeArcmin: 0.7 },
  { name: "Saturn", sizeArcmin: 0.3 },
  { name: "Moon", sizeArcmin: 31 },
];

const FovCalculator = () => {
  const [telescopeIdx, setTelescopeIdx] = useState("1");
  const [cameraIdx, setCameraIdx] = useState("1");
  const [focalLength, setFocalLength] = useState(TELESCOPES[1].focalLength);
  const [sensorW, setSensorW] = useState(CAMERAS[1].sensorW);
  const [sensorH, setSensorH] = useState(CAMERAS[1].sensorH);
  const [pixelSize, setPixelSize] = useState(CAMERAS[1].pixelSize);
  const [barlow, setBarlow] = useState(1);
  const [selectedObject, setSelectedObject] = useState("0");

  const effectiveFL = focalLength * barlow;

  // Save equipment to localStorage for use in Sky Atlas
  useEffect(() => {
    localStorage.setItem("astrodash_equipment", JSON.stringify({
      focalLength: effectiveFL,
      sensorWidth: sensorW,
      sensorHeight: sensorH,
    }));
  }, [effectiveFL, sensorW, sensorH]);

  const fov = useMemo(() => {
    if (effectiveFL <= 0) return { w: 0, h: 0, wArcmin: 0, hArcmin: 0, resolution: 0 };
    const wDeg = 2 * Math.atan(sensorW / (2 * effectiveFL)) * (180 / Math.PI);
    const hDeg = 2 * Math.atan(sensorH / (2 * effectiveFL)) * (180 / Math.PI);
    const resolution = effectiveFL > 0 ? (pixelSize / effectiveFL) * 206.265 : 0;
    return { w: wDeg, h: hDeg, wArcmin: wDeg * 60, hArcmin: hDeg * 60, resolution };
  }, [effectiveFL, sensorW, sensorH, pixelSize]);

  const obj = OBJECTS[parseInt(selectedObject)];
  const objFractionW = obj ? obj.sizeArcmin / fov.wArcmin : 0;
  const objFractionH = obj ? obj.sizeArcmin / fov.hArcmin : 0;

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-foreground">Field of View Calculator</h2>
          <p className="text-muted-foreground mt-1">See how objects fit in your telescope + camera setup</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 space-y-5"
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Equipment Setup</h3>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Telescope</Label>
              <Select value={telescopeIdx} onValueChange={(v) => {
                setTelescopeIdx(v);
                const t = TELESCOPES[parseInt(v)];
                if (t.focalLength > 0) setFocalLength(t.focalLength);
              }}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TELESCOPES.map((t, i) => (
                    <SelectItem key={i} value={String(i)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Focal Length (mm)</Label>
                <Input type="number" value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} className="bg-secondary/50 font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Barlow / Reducer</Label>
                <Input type="number" step="0.1" value={barlow} onChange={(e) => setBarlow(Number(e.target.value))} className="bg-secondary/50 font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Camera</Label>
              <Select value={cameraIdx} onValueChange={(v) => {
                setCameraIdx(v);
                const c = CAMERAS[parseInt(v)];
                if (c.sensorW > 0) { setSensorW(c.sensorW); setSensorH(c.sensorH); setPixelSize(c.pixelSize); }
              }}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMERAS.map((c, i) => (
                    <SelectItem key={i} value={String(i)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sensor W (mm)</Label>
                <Input type="number" step="0.1" value={sensorW} onChange={(e) => setSensorW(Number(e.target.value))} className="bg-secondary/50 font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sensor H (mm)</Label>
                <Input type="number" step="0.1" value={sensorH} onChange={(e) => setSensorH(Number(e.target.value))} className="bg-secondary/50 font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pixel (µm)</Label>
                <Input type="number" step="0.01" value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} className="bg-secondary/50 font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Target Object</Label>
              <Select value={selectedObject} onValueChange={setSelectedObject}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTS.map((o, i) => (
                    <SelectItem key={i} value={String(i)}>{o.name} ({o.sizeArcmin}')</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <ResultItem label="FOV Width" value={`${fov.w.toFixed(2)}° (${fov.wArcmin.toFixed(1)}')`} />
                <ResultItem label="FOV Height" value={`${fov.h.toFixed(2)}° (${fov.hArcmin.toFixed(1)}')`} />
                <ResultItem label="Effective FL" value={`${effectiveFL} mm`} />
                <ResultItem label="Sampling" value={`${fov.resolution.toFixed(2)} "/px`} />
                <ResultItem
                  label="Sampling Quality"
                  value={
                    fov.resolution < 0.5 ? "Oversampled" :
                    fov.resolution < 1.5 ? "Optimal" :
                    fov.resolution < 3 ? "Undersampled" : "Very wide"
                  }
                  highlight={fov.resolution >= 0.5 && fov.resolution < 1.5}
                />
                {obj && (
                  <ResultItem
                    label={`${obj.name} framing`}
                    value={`${(objFractionW * 100).toFixed(0)}% of width`}
                  />
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">FOV Preview</h3>
              <div className="relative bg-muted/30 rounded-xl border border-border overflow-hidden" style={{ paddingBottom: `${(fov.h / Math.max(fov.w, 0.01)) * 100}%`, minHeight: 200 }}>
                <div className="absolute inset-0 border-2 border-primary/40 rounded-lg" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />
                </div>
                {obj && objFractionW > 0 && (
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/60 bg-accent/5"
                    style={{
                      width: `${Math.min(objFractionW * 100, 200)}%`,
                      paddingBottom: `${Math.min(objFractionH * 100, 200)}%`,
                    }}
                  />
                )}
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-muted-foreground">
                  {fov.w.toFixed(2)}° × {fov.h.toFixed(2)}°
                </div>
                {obj && (
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-accent">
                    {obj.name}: {obj.sizeArcmin}'
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const ResultItem = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-sm font-mono font-medium ${highlight ? "text-green-400" : "text-foreground"}`}>{value}</p>
  </div>
);

export default FovCalculator;
