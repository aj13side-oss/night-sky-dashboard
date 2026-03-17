import AppNav from "@/components/AppNav";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getSkyImageUrlWithFov, type SkyImageSurvey } from "@/lib/sky-images";

import TargetObjectPicker, { type TargetObject } from "@/components/fov/TargetObjectPicker";
import { useSolarSystemObjects } from "@/hooks/useSolarSystemObjects";

import { useCameras, useTelescopes } from "@/hooks/useEquipmentCatalog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_TARGET: TargetObject = { name: "M31 — Andromeda", sizeArcmin: 178, exposureFast: 30, exposureDeep: 120, ra: 10.6847, dec: 41.2687 };

const BARLOW_OPTIONS = [
  { value: "0.5", label: "0.5× Reducer" },
  { value: "0.6", label: "0.6× Reducer" },
  { value: "0.63", label: "0.63× Reducer (Celestron)" },
  { value: "0.7", label: "0.7× Reducer (Askar)" },
  { value: "0.73", label: "0.73× Reducer (Takahashi)" },
  { value: "0.77", label: "0.77× Reducer (Starizona)" },
  { value: "0.8", label: "0.8× Reducer" },
  { value: "0.85", label: "0.85× Reducer (Sky-Watcher)" },
  { value: "1", label: "None (1×)" },
  { value: "1.5", label: "1.5× Barlow" },
  { value: "2", label: "2× Barlow" },
  { value: "2.5", label: "2.5× Powermate" },
  { value: "3", label: "3× Barlow" },
  { value: "4", label: "4× Powermate" },
  { value: "5", label: "5× Powermate" },
];

const FovCalculator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [rotation, setRotation] = useState(0);
  const [selectedObject, setSelectedObject] = useState<TargetObject>(DEFAULT_TARGET);
  const [survey, setSurvey] = useState<SkyImageSurvey>("dss2");
  const [telescopeSearch, setTelescopeSearch] = useState("");
  const [cameraSearch, setCameraSearch] = useState("");

  useEffect(() => {
    const target = searchParams.get("target");
    if (!target) return;

    const fetchTarget = async () => {
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("catalog_id, common_name, size_max, ra_deg, dec_deg, exposure_guide_fast, exposure_guide_deep, forced_image_url")
        .eq("catalog_id", target)
        .maybeSingle();

      if (data && data.size_max > 0) {
        setSelectedObject({
          name: data.common_name ? `${data.catalog_id} — ${data.common_name}` : data.catalog_id,
          sizeArcmin: data.size_max,
          exposureFast: data.exposure_guide_fast ?? null,
          exposureDeep: data.exposure_guide_deep ?? null,
          ra: data.ra_deg ?? null,
          dec: data.dec_deg ?? null,
        });
      } else {
        const sso = solarObjects.find(s => s.name.toLowerCase() === target.toLowerCase());
        if (sso) {
          setSelectedObject({
            name: sso.name,
            sizeArcmin: (sso.max_apparent_size_arcsec ?? 0) / 60,
            exposureFast: null,
            exposureDeep: null,
            ra: null,
            dec: null,
            imageUrl: sso.image_url ?? undefined,
            isSolarSystem: true,
          });
        }
      }
    };

    fetchTarget();
  }, [searchParams, solarObjects]);

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
        if (parsed.barlow) setBarlow(parsed.barlow);
        if (parsed.rotation != null) setRotation(parsed.rotation);
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
      barlow,
      rotation,
    }));
  }, [effectiveFL, sensorW, sensorH, pixelSize, telescopeId, cameraId, barlow, rotation]);

  // Instant FOV for results
  const fov = useMemo(() => {
    if (effectiveFL <= 0) return { w: 0, h: 0, wArcmin: 0, hArcmin: 0, resolution: 0 };
    const wDeg = 2 * Math.atan(sensorW / (2 * effectiveFL)) * (180 / Math.PI);
    const hDeg = 2 * Math.atan(sensorH / (2 * effectiveFL)) * (180 / Math.PI);
    const resolution = effectiveFL > 0 ? (pixelSize / effectiveFL) * 206.265 : 0;
    return { w: wDeg, h: hDeg, wArcmin: wDeg * 60, hArcmin: hDeg * 60, resolution };
  }, [effectiveFL, sensorW, sensorH, pixelSize]);

  // Debounced values for image loading only
  const [debouncedFL, setDebouncedFL] = useState(effectiveFL);
  const [debouncedSensorW, setDebouncedSensorW] = useState(sensorW);
  const [debouncedSensorH, setDebouncedSensorH] = useState(sensorH);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFL(effectiveFL);
      setDebouncedSensorW(sensorW);
      setDebouncedSensorH(sensorH);
    }, 600);
    return () => clearTimeout(timer);
  }, [effectiveFL, sensorW, sensorH]);

  // Debounced FOV for image only
  const debouncedFov = useMemo(() => {
    if (debouncedFL <= 0) return { w: 0, h: 0, wArcmin: 0, hArcmin: 0 };
    const wDeg = 2 * Math.atan(debouncedSensorW / (2 * debouncedFL)) * (180 / Math.PI);
    const hDeg = 2 * Math.atan(debouncedSensorH / (2 * debouncedFL)) * (180 / Math.PI);
    return { w: wDeg, h: hDeg, wArcmin: wDeg * 60, hArcmin: hDeg * 60 };
  }, [debouncedFL, debouncedSensorW, debouncedSensorH]);

  const obj = selectedObject;
  const objFractionW = obj ? obj.sizeArcmin / fov.wArcmin : 0;
  const objFractionH = obj ? obj.sizeArcmin / fov.hArcmin : 0;

  // True size percentage for planet rendering
  const trueSizePercent = (obj?.sizeArcmin ?? 0) / (fov.wArcmin * 1.3) * 100;
  const trueSizePercentH = (obj?.sizeArcmin ?? 0) / (fov.hArcmin * 1.3) * 100;

  const aladinFovDeg = useMemo(() => {
    const sensorFovDeg = debouncedFov.w > 0 ? debouncedFov.w : 1.0;
    const objFovDeg = obj && obj.sizeArcmin > 0 ? (obj.sizeArcmin / 60) : 0;
    if (objFovDeg <= 0) return sensorFovDeg * 1.2;
    const objectViewFov = objFovDeg * 2.5;
    const sensorViewFov = sensorFovDeg * 1.3;
    return Math.min(10.0, Math.max(0.05, Math.max(objectViewFov, sensorViewFov)));
  }, [obj, debouncedFov.w]);

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

  // Progressive image loading state
  const [currentImgUrl, setCurrentImgUrl] = useState<string | null>(null);
  const [prevImgUrl, setPrevImgUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const skyImageUrl = obj?.ra != null && obj?.dec != null && debouncedFov.w > 0
    ? getSkyImageUrlWithFov(obj.ra, obj.dec, aladinFovDeg, aladinFovDeg * (debouncedFov.h / Math.max(debouncedFov.w, 0.01)), survey)
    : null;

  // When skyImageUrl changes, start transition (deep sky only)
  useEffect(() => {
    if (skyImageUrl && skyImageUrl !== currentImgUrl) {
      setPrevImgUrl(currentImgUrl);
      setCurrentImgUrl(skyImageUrl);
      setIsTransitioning(true);
      setImgLoaded(false);
      setImgError(false);
    }
  }, [skyImageUrl]);

  // Reset for solar system objects
  useEffect(() => {
    if (obj?.isSolarSystem) {
      setImgLoaded(false);
      setImgError(false);
    }
  }, [obj?.name, obj?.imageUrl]);

  const handleImageLoad = () => {
    setImgLoaded(true);
    setIsTransitioning(false);
    setPrevImgUrl(null);
  };

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
                <Select value={String(barlow)} onValueChange={(v) => setBarlow(Number(v))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BARLOW_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Sensor Rotation</Label>
                <span className="text-xs font-mono text-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(v) => setRotation(v[0])}
                min={0}
                max={359}
                step={1}
                className="w-full"
              />
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
                {obj && (
                  <ResultItem
                    label={`Framing ${obj.name}`}
                    value={
                      objFractionW >= 0.01
                        ? `${(objFractionW * 100).toFixed(0)}% of width`
                        : `${(objFractionW * 100).toFixed(1)}% of width — very small, consider using a barlow`
                    }
                  />
                )}
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
                    {!imgLoaded && !imgError && !isTransitioning && (
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
                          {trueSizePercent >= 2 ? (
                            <img
                              key={`solar-${obj?.name}`}
                              src={obj?.imageUrl ?? ""}
                              alt={`${obj?.name} reference image`}
                              className={`object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                              style={{
                                width: `${trueSizePercent}%`,
                                height: `${trueSizePercentH}%`,
                              }}
                              loading="eager"
                              onLoad={() => setImgLoaded(true)}
                              onError={() => setImgError(true)}
                            />
                          ) : (
                            <>
                              {/* True-scale dot for tiny objects */}
                              <div
                                className="rounded-full bg-accent/90 animate-pulse shadow-[0_0_12px_3px_hsl(var(--accent)/0.6)]"
                                style={{
                                  width: `${Math.max(0.5, trueSizePercent)}%`,
                                  paddingBottom: `${Math.max(0.5, trueSizePercent)}%`,
                                }}
                              />
                              {/* Hidden img to trigger load state */}
                              <img src={obj?.imageUrl ?? ""} className="hidden" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
                            </>
                          )}
                        </div>
                        {/* Detail inset — always show for solar system */}
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
                              {trueSizePercent < 2 && " (enlarged)"}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Previous image (fading out) */}
                        {isTransitioning && prevImgUrl && (
                          <img
                            src={prevImgUrl}
                            alt="Previous view"
                            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px]"
                          />
                        )}

                        {/* Loading indicator overlay on top of old image */}
                        {isTransitioning && (
                          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
                            <div className="h-5 w-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground ml-2">Updating view...</span>
                          </div>
                        )}

                        {/* New image (fading in) */}
                        <img
                          key={currentImgUrl}
                          src={currentImgUrl ?? ""}
                          alt={`Sky view centered on ${obj?.name}`}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                          loading="eager"
                          onLoad={handleImageLoad}
                          onError={() => setImgError(true)}
                        />
                      </>
                    )}

                    {/* Sensor FOV overlay */}
                    {imgLoaded && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }} />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }} />

                        {isSolar ? (
                          <>
                            {/* Sensor frame at 77% of container (= 1/1.3) */}
                            <div
                              className="absolute border-2 border-primary/60 rounded"
                              style={{
                                width: `${(1 / 1.3) * 100}%`,
                                height: `${(1 / 1.3) * 100}%`,
                                left: `${50 - (1 / 1.3) * 50}%`,
                                top: `${50 - (1 / 1.3) * 50}%`,
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: 'center center',
                              }}
                            />
                            {/* Blue object circle — true scale */}
                            {obj && obj.sizeArcmin > 0 && trueSizePercent >= 1 && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70"
                                style={{
                                  width: `${trueSizePercent}%`,
                                  paddingBottom: `${trueSizePercentH}%`,
                                }} />
                            )}
                            {obj && obj.sizeArcmin > 0 && trueSizePercent < 1 && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/80 animate-pulse shadow-[0_0_8px_2px_hsl(var(--accent)/0.5)]" />
                            )}
                          </>
                        ) : (
                          <>
                            {aladinFovDeg > 0 && (
                              <div
                                className="absolute border-2 border-primary/60 rounded"
                                style={{
                                  width: `${Math.min((fov.w / aladinFovDeg) * 100, 98)}%`,
                                  height: `${Math.min((fov.h / aladinFovDeg) * 100, 98)}%`,
                                  left: `${50 - Math.min((fov.w / aladinFovDeg) * 50, 49)}%`,
                                  top: `${50 - Math.min((fov.h / aladinFovDeg) * 50, 49)}%`,
                                  transform: `rotate(${rotation}deg)`,
                                  transformOrigin: 'center center',
                                }}
                              />
                            )}
                            {/* Object circle — deep sky only */}
                            {objFractionW > 0 && (
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

              {/* Legend */}
              {imgLoaded && obj && (
                <div className="flex items-center gap-4 mt-2 px-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-3 border border-primary/60 rounded-sm" />
                    Sensor FOV
                  </span>
                  {!isSolar && objFractionW > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full border border-accent/70" />
                      Object size
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0 border-t border-primary/30" />
                    Center
                  </span>
                </div>
              )}

              {/* Image credits for solar system */}
              {isSolar && solarObj && imgLoaded && solarObj.image_credit && (
                <div className="text-[9px] text-muted-foreground/60 mt-1 px-1">
                  📷 {solarObj.image_credit} · {solarObj.image_license}
                  {solarObj.image_source_url && (
                    <> · <a href={solarObj.image_source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">Source</a></>
                  )}
                </div>
              )}

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
                      : objFractionW >= 0.01
                      ? ` very small in frame (${(objFractionW * 100).toFixed(0)}%)`
                      : ` very small in frame (${(objFractionW * 100).toFixed(1)}%)`}
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
