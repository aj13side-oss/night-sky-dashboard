import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { getSkyImageUrlWithFov, type SkyImageSurvey } from "@/lib/sky-images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImagingImpactCard from "@/components/lightpollution/ImagingImpactCard";
import ToolSuggestions from "@/components/ToolSuggestions";
import TargetObjectPicker, { type TargetObject } from "@/components/fov/TargetObjectPicker";
import ExposureCalculator from "@/components/fov/ExposureCalculator";
import { useCameras, useTelescopes } from "@/hooks/useEquipmentCatalog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const DEFAULT_TARGET: TargetObject = { name: "M31 — Andromeda", sizeArcmin: 178, exposureFast: 30, exposureDeep: 120, ra: 10.6847, dec: 41.2687 };

const FovCalculator = () => {
  const { data: dbTelescopes } = useTelescopes();
  const { data: dbCameras } = useCameras();

  const [telescopeId, setTelescopeId] = useState<string>("custom");
  const [cameraId, setCameraId] = useState<string>("custom");
  const [focalLength, setFocalLength] = useState(900);
  const [sensorW, setSensorW] = useState(23.2);
  const [sensorH, setSensorH] = useState(15.5);
  const [pixelSize, setPixelSize] = useState(4.63);
  const [barlow, setBarlow] = useState(1);
  const [selectedObject, setSelectedObject] = useState<TargetObject>(DEFAULT_TARGET);
  const [survey, setSurvey] = useState<SkyImageSurvey>("mellinger");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cosmicframe_equipment") || localStorage.getItem("astrodash_equipment");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.telescopeId) setTelescopeId(parsed.telescopeId);
        if (parsed.cameraId) setCameraId(parsed.cameraId);
        if (parsed.focalLength) setFocalLength(parsed.focalLength);
        if (parsed.sensorWidth) setSensorW(parsed.sensorWidth);
        if (parsed.sensorHeight) setSensorH(parsed.sensorHeight);
        if (parsed.pixelSize) setPixelSize(parsed.pixelSize);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (telescopeId !== "custom" && dbTelescopes) {
      const t = dbTelescopes.find(t => t.id === telescopeId);
      if (t) setFocalLength(t.focal_length_mm ?? focalLength);
    }
  }, [dbTelescopes, telescopeId]);

  useEffect(() => {
    if (cameraId !== "custom" && dbCameras) {
      const c = dbCameras.find(c => c.id === cameraId);
      if (c) {
        setSensorW(c.sensor_width_mm ?? sensorW);
        setSensorH(c.sensor_height_mm ?? sensorH);
        setPixelSize(c.pixel_size_um ?? pixelSize);
      }
    }
  }, [dbCameras, cameraId]);

  const handleTelescopeChange = (id: string) => {
    setTelescopeId(id);
    if (id === "custom") return;
    const t = dbTelescopes?.find(t => t.id === id);
    if (t) {
      if (t.focal_length_mm) setFocalLength(t.focal_length_mm);
    }
  };

  const handleCameraChange = (id: string) => {
    setCameraId(id);
    if (id === "custom") return;
    const c = dbCameras?.find(c => c.id === id);
    if (c) {
      if (c.sensor_width_mm) setSensorW(c.sensor_width_mm);
      if (c.sensor_height_mm) setSensorH(c.sensor_height_mm);
      if (c.pixel_size_um) setPixelSize(c.pixel_size_um);
    }
  };

  const effectiveFL = focalLength * barlow;

  useEffect(() => {
    localStorage.setItem("astrodash_equipment", JSON.stringify({
      focalLength: effectiveFL,
      sensorWidth: sensorW,
      sensorHeight: sensorH,
      pixelSize,
      telescopeId: telescopeId !== "custom" ? telescopeId : undefined,
      cameraId: cameraId !== "custom" ? cameraId : undefined,
    }));
  }, [effectiveFL, sensorW, sensorH, pixelSize, telescopeId, cameraId]);

  const fov = useMemo(() => {
    if (effectiveFL <= 0) return { w: 0, h: 0, wArcmin: 0, hArcmin: 0, resolution: 0 };
    const wDeg = 2 * Math.atan(sensorW / (2 * effectiveFL)) * (180 / Math.PI);
    const hDeg = 2 * Math.atan(sensorH / (2 * effectiveFL)) * (180 / Math.PI);
    const resolution = effectiveFL > 0 ? (pixelSize / effectiveFL) * 206.265 : 0;
    return { w: wDeg, h: hDeg, wArcmin: wDeg * 60, hArcmin: hDeg * 60, resolution };
  }, [effectiveFL, sensorW, sensorH, pixelSize]);

  const obj = selectedObject;
  const objFractionW = obj ? obj.sizeArcmin / fov.wArcmin : 0;
  const objFractionH = obj ? obj.sizeArcmin / fov.hArcmin : 0;

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Calculateur de Champ de Vue (FOV) & Échantillonnage"
        description="Calculez le champ de vue et l'échantillonnage de votre setup astrophoto. Simulez le cadrage sur n'importe quel objet céleste. Compatible tous télescopes et caméras astro."
        keywords="calculateur champ de vue, FOV calculator, échantillonnage astrophoto, arcsec pixel, cadrage nébuleuse, simulateur astrophotographie, field of view"
        path="/fov-calculator"
      />
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-foreground">FOV Calculator</h2>
          <p className="text-muted-foreground mt-1">Visualize how objects fit in your telescope + camera setup</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Configuration</h3>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Telescope</Label>
              <Select value={telescopeId} onValueChange={handleTelescopeChange}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Choose a telescope..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                  {dbTelescopes?.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.brand} {t.model} ({t.focal_length_mm}mm{t.f_ratio ? ` f/${t.f_ratio}` : ""})
                    </SelectItem>
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
              <Select value={cameraId} onValueChange={handleCameraChange}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Choose a camera..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                  {dbCameras?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.pixel_size_um}µm)
                    </SelectItem>
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

            <TargetObjectPicker value={selectedObject} onChange={setSelectedObject} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <ResultItem label="FOV Width" value={`${fov.w.toFixed(2)}° (${fov.wArcmin.toFixed(1)}')`} />
                <ResultItem label="FOV Height" value={`${fov.h.toFixed(2)}° (${fov.hArcmin.toFixed(1)}')`} />
                <ResultItem label="Effective Focal Length" value={`${effectiveFL} mm`} />
                <ResultItem label="Sampling" value={`${fov.resolution.toFixed(2)} "/px`} />
                <ResultItem label="Sampling Quality"
                  value={fov.resolution < 0.5 ? "Oversampled" : fov.resolution < 1.5 ? "Optimal" : fov.resolution < 3 ? "Undersampled" : "Very wide"}
                  highlight={fov.resolution >= 0.5 && fov.resolution < 1.5} />
                {obj && <ResultItem label={`Framing ${obj.name}`} value={`${(objFractionW * 100).toFixed(0)}% of width`} />}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">FOV Preview</h3>
                <div className="flex rounded-md border border-border overflow-hidden text-[10px]">
                  <button onClick={() => setSurvey("mellinger")}
                    className={`px-2.5 py-1 transition-colors ${survey === "mellinger" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}>
                    📷 Photo
                  </button>
                  <button onClick={() => setSurvey("dss2")}
                    className={`px-2.5 py-1 transition-colors border-l border-border ${survey === "dss2" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}>
                    🔬 Scientific
                  </button>
                </div>
              </div>
              <div className="relative rounded-xl border border-border overflow-hidden"
                style={{ paddingBottom: `${(fov.h / Math.max(fov.w, 0.01)) * 100}%`, minHeight: 200 }}>
                {obj?.ra != null && obj?.dec != null && fov.w > 0 ? (
                  <img key={`${obj.ra}-${obj.dec}-${survey}`}
                    src={getSkyImageUrlWithFov(obj.ra, obj.dec, fov.w, fov.h, survey)}
                    alt={obj.name} className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="absolute inset-0 bg-muted/30" />
                )}
                <div className="absolute inset-0 border-2 border-primary/50 rounded-lg" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/40" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/40" />
                {obj && objFractionW > 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70"
                    style={{ width: `${Math.min(objFractionW * 100, 200)}%`, paddingBottom: `${Math.min(objFractionH * 100, 200)}%` }} />
                )}
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/80 drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded">
                  {fov.w.toFixed(2)}° × {fov.h.toFixed(2)}°
                </div>
                {obj && (
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-white/90 drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded">
                    {obj.name}: {obj.sizeArcmin}'
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ExposureCalculator target={selectedObject} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ImagingImpactCard />
        </motion.div>

        <ToolSuggestions />
      </main>

      <Footer />
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
