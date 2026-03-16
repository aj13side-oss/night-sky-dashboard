import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Telescope, Camera, Save, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { useCameras, useTelescopes } from "@/hooks/useEquipmentCatalog";
import RigBuilderSection from "@/components/rigbuilder/RigBuilderSection";

interface EquipmentData {
  focalLength: number;
  aperture: number;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  cameraType: string;
  telescopeName: string;
  cameraName: string;
  telescopeId?: string;
  cameraId?: string;
}

const STORAGE_KEY = "cosmicframe_equipment";

const EquipmentProfile = () => {
  const { data: dbTelescopes } = useTelescopes();
  const { data: dbCameras } = useCameras();

  const [equipment, setEquipment] = useState<EquipmentData>({
    focalLength: 0, aperture: 0, sensorWidth: 0, sensorHeight: 0,
    pixelSize: 0, cameraType: "", telescopeName: "", cameraName: "",
  });
  const [saved, setSaved] = useState(false);
  const [telescopePreset, setTelescopePreset] = useState<string>("custom");
  const [cameraPreset, setCameraPreset] = useState<string>("custom");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("astrodash_equipment");
      if (raw) {
        const parsed = JSON.parse(raw);
        setEquipment(prev => ({ ...prev, ...parsed }));
        if (parsed.telescopeId) setTelescopePreset(parsed.telescopeId);
        if (parsed.cameraId) setCameraPreset(parsed.cameraId);
      }
    } catch {}
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...equipment,
      telescopeId: telescopePreset !== "custom" ? telescopePreset : undefined,
      cameraId: cameraPreset !== "custom" ? cameraPreset : undefined,
    }));
    setSaved(true);
    toast.success("Equipment profile saved!", { description: "Stored locally in your browser." });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTelescopePreset = (id: string) => {
    setTelescopePreset(id);
    if (id === "custom") return;
    const t = dbTelescopes?.find(t => t.id === id);
    if (t) {
      setEquipment(prev => ({
        ...prev,
        focalLength: t.focal_length_mm ?? 0,
        aperture: t.aperture_mm ?? 0,
        telescopeName: `${t.brand} ${t.model}`,
      }));
    }
  };

  const handleCameraPreset = (id: string) => {
    setCameraPreset(id);
    if (id === "custom") return;
    const c = dbCameras?.find(c => c.id === id);
    if (c) {
      setEquipment(prev => ({
        ...prev,
        sensorWidth: c.sensor_width_mm ?? 0,
        sensorHeight: c.sensor_height_mm ?? 0,
        pixelSize: c.pixel_size_um ?? 0,
        cameraType: c.is_color ? "Color (OSC)" : "Mono",
        cameraName: `${c.brand} ${c.model}`,
      }));
    }
  };

  const samplingRate = equipment.focalLength > 0 && equipment.pixelSize > 0
    ? (equipment.pixelSize / equipment.focalLength) * 206.265 : null;
  const fovW = equipment.focalLength > 0 && equipment.sensorWidth > 0
    ? (equipment.sensorWidth / equipment.focalLength) * (180 / Math.PI) * 60 : null;
  const fovH = equipment.focalLength > 0 && equipment.sensorHeight > 0
    ? (equipment.sensorHeight / equipment.focalLength) * (180 / Math.PI) * 60 : null;
  const fRatio = equipment.focalLength > 0 && equipment.aperture > 0
    ? equipment.focalLength / equipment.aperture : null;

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="My Astrophotography Equipment & Gear Comparator"
        description="Save your telescope, camera and mount. Compare 360+ astrophotography equipment: telescopes, cameras, mounts, filters. Calculate compatibility, sampling and field of view."
        keywords="astrophoto equipment profile, astrophotography setup, telescope camera configuration, gear profile, rig builder, telescope comparison"
        path="/equipment"
      />
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" /> My Equipment
          </h1>
          <p className="text-muted-foreground mt-1">Save your gear for personalized recommendations, then browse the full equipment catalog below.</p>
        </motion.div>

        {/* Telescope + Camera side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Telescope Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Telescope className="w-5 h-5 text-primary" /> Telescope / Lens
                </CardTitle>
                <CardDescription>Select a preset or enter specs manually.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Preset</Label>
                  <Select value={telescopePreset} onValueChange={handleTelescopePreset}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue placeholder="Choose a telescope..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">✏️ Custom</SelectItem>
                      {dbTelescopes?.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.brand} {t.model} ({t.focal_length_mm}mm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="focalLength" className="text-xs text-muted-foreground">Focal Length (mm)</Label>
                    <Input id="focalLength" type="number" value={equipment.focalLength || ""}
                      onChange={(e) => setEquipment(prev => ({ ...prev, focalLength: Number(e.target.value) }))}
                      placeholder="e.g. 650" className="bg-secondary/30 border-border/50 font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="aperture" className="text-xs text-muted-foreground">Aperture (mm)</Label>
                    <Input id="aperture" type="number" value={equipment.aperture || ""}
                      onChange={(e) => setEquipment(prev => ({ ...prev, aperture: Number(e.target.value) }))}
                      placeholder="e.g. 80" className="bg-secondary/30 border-border/50 font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Camera Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" /> Camera / Sensor
                </CardTitle>
                <CardDescription>Select a preset or enter specs manually.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Preset</Label>
                  <Select value={cameraPreset} onValueChange={handleCameraPreset}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue placeholder="Choose a camera..." />
                    </SelectTrigger>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sensorWidth" className="text-xs text-muted-foreground">Sensor Width (mm)</Label>
                    <Input id="sensorWidth" type="number" step="0.1" value={equipment.sensorWidth || ""}
                      onChange={(e) => setEquipment(prev => ({ ...prev, sensorWidth: Number(e.target.value) }))}
                      placeholder="e.g. 23.5" className="bg-secondary/30 border-border/50 font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="sensorHeight" className="text-xs text-muted-foreground">Sensor Height (mm)</Label>
                    <Input id="sensorHeight" type="number" step="0.1" value={equipment.sensorHeight || ""}
                      onChange={(e) => setEquipment(prev => ({ ...prev, sensorHeight: Number(e.target.value) }))}
                      placeholder="e.g. 15.7" className="bg-secondary/30 border-border/50 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pixelSize" className="text-xs text-muted-foreground">Pixel Size (µm)</Label>
                    <Input id="pixelSize" type="number" step="0.01" value={equipment.pixelSize || ""}
                      onChange={(e) => setEquipment(prev => ({ ...prev, pixelSize: Number(e.target.value) }))}
                      placeholder="e.g. 3.76" className="bg-secondary/30 border-border/50 font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="cameraType" className="text-xs text-muted-foreground">Camera Type</Label>
                    <Select value={equipment.cameraType} onValueChange={(v) => setEquipment(prev => ({ ...prev, cameraType: v }))}>
                      <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Color (OSC)">Color (OSC)</SelectItem>
                        <SelectItem value="Color (DSLR)">Color (DSLR)</SelectItem>
                        <SelectItem value="Mono">Mono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Calculated Stats */}
        {(samplingRate || fovW || fRatio) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> Calculated Setup
                </CardTitle>
                <CardDescription>Based on your equipment configuration.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {samplingRate && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Sampling</span>
                      <p className="text-lg font-bold font-mono text-foreground">{samplingRate.toFixed(2)}″/px</p>
                      <p className="text-[10px] text-muted-foreground">
                        {samplingRate < 0.8 ? "Oversampled" : samplingRate < 2.0 ? "Ideal range" : samplingRate < 4.0 ? "Undersampled" : "Very wide"}
                      </p>
                    </div>
                  )}
                  {fovW && fovH && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Field of View</span>
                      <p className="text-lg font-bold font-mono text-foreground">{fovW.toFixed(0)}' × {fovH.toFixed(0)}'</p>
                      <p className="text-[10px] text-muted-foreground">arcminutes</p>
                    </div>
                  )}
                  {fRatio && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">f/ratio</span>
                      <p className="text-lg font-bold font-mono text-foreground">f/{fRatio.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fRatio < 4 ? "Very fast" : fRatio < 6 ? "Fast" : fRatio < 10 ? "Moderate" : "Slow"}
                      </p>
                    </div>
                  )}
                  {equipment.focalLength > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Focal Length</span>
                      <p className="text-lg font-bold font-mono text-foreground">{equipment.focalLength}mm</p>
                      <p className="text-[10px] text-muted-foreground">
                        {equipment.focalLength < 400 ? "Wide field" : equipment.focalLength < 1000 ? "Mid-range" : "Long focal"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button onClick={handleSave} size="lg" className="w-full gap-2">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saved ? "Saved!" : "Save Equipment Profile"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Stored locally in your browser. Used by the Atlas, FOV calculator, and assistant.
          </p>
        </motion.div>

        {/* Rig Builder Section */}
        <div className="border-t border-border/50 pt-8">
          <RigBuilderSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EquipmentProfile;
