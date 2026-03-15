import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSkyImageUrlWithFov, type SkyImageSurvey } from "@/lib/sky-images";

import TargetObjectPicker, { type TargetObject } from "@/components/fov/TargetObjectPicker";
import { useSolarSystemObjects } from "@/hooks/useSolarSystemObjects";

import { useCameras, useTelescopes } from "@/hooks/useEquipmentCatalog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

const DEFAULT_TARGET: TargetObject = { name: "M31 — Andromeda", sizeArcmin: 178, exposureFast: 30, exposureDeep: 120, ra: 10.6847, dec: 41.2687 };

const FovCalculator = () => {
  const [searchParams] = useSearchParams();
  const { data: dbTelescopes } = useTelescopes();
  const { data: dbCameras } = useCameras();
  const { data: solarObjects = [] } = useSolarSystemObjects();

  const [telescopeId, setTelescopeId] = useState<string>("custom");
  const [cameraId, setCameraId] = useState<string>("custom");
  const [focalLength, setFocalLength] = useState(900);
  const [sensorW, setSensorW] = useState(23.2);
  const [sensorH, setSensorH] = useState(15.5);
  const [pixelSize, setPixelSize] = useState(4.63);
  const [barlow, setBarlow] = useState(1);
  const [selectedObject, setSelectedObject] = useState<TargetObject>(DEFAULT_TARGET);
  const [survey, setSurvey] = useState<SkyImageSurvey>("dss2");
  const [telescopeSearch, setTelescopeSearch] = useState("");
  const [cameraSearch, setCameraSearch] = useState("");

  useEffect(() => {
    const target = searchParams.get("target");
    if (target) {
      setSelectedObject({ ...DEFAULT_TARGET, name: target });
    }
  }, [searchParams]);

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
    localStorage.setItem("cosmicframe_equipment", JSON.stringify({
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

  const aladinFovDeg = useMemo(() => {
    const sensorFovDeg = fov.w > 0 ? fov.w : 1.0;
    const objFovDeg = obj && obj.sizeArcmin > 0 ? (obj.sizeArcmin / 60) : 0;
    if (objFovDeg <= 0) return sensorFovDeg * 1.2;
    const objectViewFov = objFovDeg * 2.5;
    const sensorViewFov = sensorFovDeg * 1.3;
    return Math.min(10.0, Math.max(0.05, Math.max(objectViewFov, sensorViewFov)));
  }, [obj, fov.w]);

  const samplingLabel = useMemo(() => {
    const r = fov.resolution;
    if (r < 0.5) return { text: "Oversampled (planetary zone)", ok: false };
    if (r < 1.0) return { text: "Slightly oversampled", ok: false };
    if (r < 2.5) return { text: "Optimal for deep sky", ok: true };
    if (r < 3.5) return { text: "Undersampled", ok: false };
    return { text: "Very wide field", ok: false };
  }, [fov.resolution]);

  const imageAspect = fov.h / Math.max(fov.w, 0.001);

  const filteredTelescopes = useMemo(() => {
    if (!dbTelescopes) return [];
    if (!telescopeSearch.trim()) return dbTelescopes;
    const q = telescopeSearch.toLowerCase();
    return dbTelescopes.filter(t =>
      `${t.brand} ${t.model}`.toLowerCase().includes(q)
    );
  }, [dbTelescopes, telescopeSearch]);

  const filteredCameras = useMemo(() => {
    if (!dbCameras) return [];
    if (!cameraSearch.trim()) return dbCameras;
    const q = cameraSearch.toLowerCase();
    return dbCameras.filter(c =>
      `${c.brand} ${c.model}`.toLowerCase().includes(q)
    );
  }, [dbCameras, cameraSearch]);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [obj?.ra, obj?.dec, obj?.imageUrl, survey, aladinFovDeg]);

  const skyImageUrl = obj?.ra != null && obj?.dec != null && fov.w > 0
    ? getSkyImageUrlWithFov(obj.ra, obj.dec, aladinFovDeg, aladinFovDeg * (fov.h / Math.max(fov.w, 0.001)), survey)
    : null;

  const isSolar = obj?.isSolarSystem === true;
  const solarObj = isSolar ? solarObjects.find(s => s.name === obj?.name) : null;

  const hasImage = isSolar ? !!obj?.imageUrl : (obj?.ra != null && obj?.dec != null);

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Field of View & Sampling Calculator"
        description="Calculate the field of view and sampling of your astrophotography setup. Simulate framing on any celestial object. Compatible with all telescopes and astro cameras."
        keywords="field of view calculator, FOV calculator, astrophoto sampling, arcsec pixel, nebula framing, astrophotography simulator"
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
                  <div className="p-2 sticky top-0 bg-popover">
                    <Input
                      placeholder="Search telescopes..."
                      value={telescopeSearch}
                      onChange={(e) => setTelescopeSearch(e.target.value)}
                      className="h-8 text-xs bg-secondary/50"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                  {filteredTelescopes.map(t => (
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
                  <div className="p-2 sticky top-0 bg-popover">
                    <Input
                      placeholder="Search cameras..."
                      value={cameraSearch}
                      onChange={(e) => setCameraSearch(e.target.value)}
                      className="h-8 text-xs bg-secondary/50"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                  {filteredCameras.map(c => (
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
                  value={samplingLabel.text}
                  highlight={samplingLabel.ok} />
                {obj && <ResultItem label={`Framing ${obj.name}`} value={`${(objFractionW * 100).toFixed(0)}% of width`} />}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">FOV Preview</h3>
                {!isSolar && (
                  <div className="flex rounded-md border border-border overflow-hidden text-[10px]">
                    <button onClick={() => setSurvey("dss2")}
                      className={`px-2.5 py-1 transition-colors ${survey === "dss2" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}>
                      📷 Photo
                    </button>
                    <button onClick={() => setSurvey("mellinger")}
                      className={`px-2.5 py-1 transition-colors border-l border-border ${survey === "mellinger" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}>
                      🔬 Scientific
                    </button>
                  </div>
                )}
              </div>

              <div className="relative rounded-xl border border-border overflow-hidden bg-black max-w-[800px] mx-auto">
                {hasImage ? (
                  <div className="relative w-full" style={{ paddingBottom: `${imageAspect * 100}%` }}>
                    {!imgLoaded && !imgError && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-6 w-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground ml-2">Loading {isSolar ? "image" : "sky view"}...</span>
                      </div>
                    )}
                    {imgError && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-xs text-muted-foreground">
                          {isSolar ? "Failed to load reference image." : "Failed to load sky image. Try switching to Scientific view."}
                        </span>
                      </div>
                    )}

                    {isSolar ? (
                      <>
                        {/* Black space background */}
                        <div className="absolute inset-0 bg-black" />
                        {/* Planet image scaled to true angular size */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            key={`solar-${obj?.name}`}
                            src={obj?.imageUrl ?? ""}
                            alt={`${obj?.name} reference image`}
                            className={`object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                              width: `${Math.max(5, objFractionW * 100)}%`,
                              height: `${Math.max(5, objFractionH * 100)}%`,
                            }}
                            loading="eager"
                            onLoad={() => setImgLoaded(true)}
                            onError={() => setImgError(true)}
                          />
                        </div>
                        {/* Detail inset for solar system objects */}
                        {imgLoaded && obj?.imageUrl && (
                          <div className="absolute bottom-3 right-3 w-36 h-36 rounded-lg border-2 border-accent/60 overflow-hidden shadow-lg z-20 bg-black">
                            <img
                              src={obj.imageUrl}
                              alt={`${obj.name} detail`}
                              className="w-full h-full object-contain p-2"
                              loading="eager"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-accent text-center py-0.5 font-mono">
                              🔍 {obj.name} — {obj.sizeArcmin >= 1 ? `${obj.sizeArcmin.toFixed(1)}'` : `${(obj.sizeArcmin * 60).toFixed(1)}"`}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <img
                        key={`${obj?.ra}-${obj?.dec}-${survey}-${aladinFovDeg}`}
                        src={getSkyImageUrlWithFov(obj!.ra!, obj!.dec!, aladinFovDeg, aladinFovDeg * (fov.h / Math.max(fov.w, 0.01)), survey)}
                        alt={`Sky view centered on ${obj?.name}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="eager"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                      />
                    )}

                    {/* Sensor FOV overlay */}
                    {imgLoaded && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />

                        {!isSolar && aladinFovDeg > 0 && (
                          <div
                            className="absolute border-2 border-primary/60 rounded"
                            style={{
                              width: `${Math.min((fov.w / aladinFovDeg) * 100, 98)}%`,
                              height: `${Math.min((fov.h / aladinFovDeg) * 100, 98)}%`,
                              left: `${50 - Math.min((fov.w / aladinFovDeg) * 50, 49)}%`,
                              top: `${50 - Math.min((fov.h / aladinFovDeg) * 50, 49)}%`,
                            }}
                          />
                        )}

                        {objFractionW > 0 && !isSolar && (
                          <>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70"
                              style={{
                                width: `${Math.max(3, Math.min(objFractionW * (fov.w / aladinFovDeg) * 100, 200))}%`,
                                paddingBottom: `${Math.max(3, Math.min(objFractionH * (fov.h / aladinFovDeg) * 100, 200))}%`,
                              }} />
                            {objFractionW < 0.1 && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent/80 animate-pulse shadow-[0_0_8px_2px_hsl(var(--accent)/0.5)]" />
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Object detail inset for small deep sky objects */}
                    {imgLoaded && obj && !isSolar && objFractionW < 0.25 && objFractionW > 0 && obj.ra != null && obj.dec != null && (
                      <div className="absolute bottom-3 right-3 w-44 h-44 rounded-lg border-2 border-accent/60 overflow-hidden shadow-lg z-20 bg-black">
                        <img
                          src={getSkyImageUrlWithFov(obj.ra, obj.dec, (obj.sizeArcmin * 5) / 60, (obj.sizeArcmin * 5) / 60, "dss2")}
                          alt={`Closeup of ${obj.name}`}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="rounded-full border border-accent/50" style={{ width: '20%', height: '20%' }} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] text-accent text-center py-0.5 font-mono">
                          🔍 {obj.name} — {obj.sizeArcmin}' closeup
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-accent/50" />
                      </div>
                    )}

                    {/* Labels */}
                    {imgLoaded && (
                      <>
                        <div className="absolute top-2 left-2 bg-black/70 text-[10px] text-foreground font-mono px-2 py-1 rounded z-10">
                          {obj?.name}: {obj?.sizeArcmin != null && obj.sizeArcmin >= 1 ? `${obj.sizeArcmin.toFixed(1)}'` : `${((obj?.sizeArcmin ?? 0) * 60).toFixed(1)}"`}
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] text-muted-foreground font-mono px-2 py-1 rounded z-10">
                          {fov.wArcmin.toFixed(0)}' × {fov.hArcmin.toFixed(0)}' sensor
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                    <span className="text-muted-foreground text-sm">
                      {obj ? `No sky image available for ${obj.name}` : "Select equipment and a target to preview framing"}
                    </span>
                  </div>
                )}
              </div>

              {/* Solar system imaging tips */}
              {isSolar && solarObj?.danger_warning && (
                <div className="mt-2 p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-xs text-destructive font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {solarObj.danger_warning}
                </div>
              )}

              {isSolar && solarObj && imgLoaded && (
                <div className="space-y-2 bg-secondary/30 rounded-lg p-3 text-xs">
                  {solarObj.recommended_technique && (
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Technique:</span> {solarObj.recommended_technique}</p>
                  )}
                  {solarObj.recommended_filters && (
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Filters:</span> {solarObj.recommended_filters}</p>
                  )}
                  {solarObj.capture_gain_note && (
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Capture:</span> {solarObj.capture_gain_note}</p>
                  )}
                  {solarObj.recommended_focal_mm && (
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Recommended focal:</span> {solarObj.recommended_focal_mm}mm</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
                <span className="font-mono">
                  Sensor: {fov.wArcmin.toFixed(0)}' × {fov.hArcmin.toFixed(0)}'
                </span>
                {obj && (
                  <span className="font-mono">
                    {obj.name}: {obj.sizeArcmin >= 1 ? `${obj.sizeArcmin.toFixed(1)}'` : `${(obj.sizeArcmin * 60).toFixed(1)}"`} →
                    {objFractionW > 1
                      ? ` overflows frame (${(objFractionW * 100).toFixed(0)}% — need mosaic)`
                      : objFractionW > 0.5
                      ? ` good framing (${(objFractionW * 100).toFixed(0)}%)`
                      : objFractionW > 0.15
                      ? ` fits with room (${(objFractionW * 100).toFixed(0)}%)`
                      : ` very small in frame (${(objFractionW * 100).toFixed(0)}%)`}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

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
