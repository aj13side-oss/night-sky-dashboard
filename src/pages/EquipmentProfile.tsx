import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Telescope, Camera, Save, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import ToolSuggestions from "@/components/ToolSuggestions";

const TELESCOPE_PRESETS = [
  { label: "William Optics RedCat 51 (250mm)", focalLength: 250, aperture: 51 },
  { label: "Sky-Watcher Evostar 72ED (420mm)", focalLength: 420, aperture: 72 },
  { label: "Sky-Watcher 130PDS (650mm)", focalLength: 650, aperture: 130 },
  { label: "Celestron C8 (2032mm)", focalLength: 2032, aperture: 203 },
  { label: "Sky-Watcher 200P (1000mm)", focalLength: 1000, aperture: 200 },
  { label: "Takahashi FSQ-106 (530mm)", focalLength: 530, aperture: 106 },
  { label: "Celestron RASA 8 (400mm)", focalLength: 400, aperture: 203 },
];

const CAMERA_PRESETS = [
  { label: "ZWO ASI294MC Pro", sensorWidth: 19.1, sensorHeight: 13.0, pixelSize: 4.63, type: "Color (OSC)" },
  { label: "ZWO ASI533MC Pro", sensorWidth: 11.31, sensorHeight: 11.31, pixelSize: 3.76, type: "Color (OSC)" },
  { label: "ZWO ASI2600MC Pro", sensorWidth: 23.5, sensorHeight: 15.7, pixelSize: 3.76, type: "Color (OSC)" },
  { label: "ZWO ASI1600MM Pro", sensorWidth: 17.7, sensorHeight: 13.4, pixelSize: 3.8, type: "Mono" },
  { label: "Canon EOS Ra", sensorWidth: 36.0, sensorHeight: 24.0, pixelSize: 5.36, type: "Color (DSLR)" },
  { label: "Nikon D810A", sensorWidth: 35.9, sensorHeight: 24.0, pixelSize: 4.88, type: "Color (DSLR)" },
  { label: "QHY268M", sensorWidth: 23.5, sensorHeight: 15.7, pixelSize: 3.76, type: "Mono" },
];

interface EquipmentData {
  focalLength: number;
  aperture: number;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  cameraType: string;
  telescopeName: string;
  cameraName: string;
}

const STORAGE_KEY = "astrodash_equipment";

const EquipmentProfile = () => {
  const [equipment, setEquipment] = useState<EquipmentData>({
    focalLength: 0,
    aperture: 0,
    sensorWidth: 0,
    sensorHeight: 0,
    pixelSize: 0,
    cameraType: "",
    telescopeName: "",
    cameraName: "",
  });
  const [saved, setSaved] = useState(false);
  const [telescopePreset, setTelescopePreset] = useState<string>("");
  const [cameraPreset, setCameraPreset] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEquipment((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    setSaved(true);
    toast.success("Equipment profile saved! Your settings will be used across AstroDash.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTelescopePreset = (label: string) => {
    setTelescopePreset(label);
    if (label === "custom") return;
    const preset = TELESCOPE_PRESETS.find((p) => p.label === label);
    if (preset) {
      setEquipment((prev) => ({
        ...prev,
        focalLength: preset.focalLength,
        aperture: preset.aperture,
        telescopeName: preset.label,
      }));
    }
  };

  const handleCameraPreset = (label: string) => {
    setCameraPreset(label);
    if (label === "custom") return;
    const preset = CAMERA_PRESETS.find((p) => p.label === label);
    if (preset) {
      setEquipment((prev) => ({
        ...prev,
        sensorWidth: preset.sensorWidth,
        sensorHeight: preset.sensorHeight,
        pixelSize: preset.pixelSize,
        cameraType: preset.type,
        cameraName: preset.label,
      }));
    }
  };

  const samplingRate = equipment.focalLength > 0 && equipment.pixelSize > 0
    ? (equipment.pixelSize / equipment.focalLength) * 206.265
    : null;

  const fovW = equipment.focalLength > 0 && equipment.sensorWidth > 0
    ? (equipment.sensorWidth / equipment.focalLength) * (180 / Math.PI) * 60
    : null;
  const fovH = equipment.focalLength > 0 && equipment.sensorHeight > 0
    ? (equipment.sensorHeight / equipment.focalLength) * (180 / Math.PI) * 60
    : null;

  const fRatio = equipment.focalLength > 0 && equipment.aperture > 0
    ? equipment.focalLength / equipment.aperture
    : null;

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" />
            Equipment Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Save your gear for personalized recommendations across AstroDash.
          </p>
        </motion.div>

        {/* Telescope Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Telescope className="w-5 h-5 text-primary" /> Telescope / Lens
              </CardTitle>
              <CardDescription>Select a preset or choose "Custom" to enter specs manually.</CardDescription>
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
                    {TELESCOPE_PRESETS.map((p) => (
                      <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="focalLength" className="text-xs text-muted-foreground">
                    Focal Length (mm)
                  </Label>
                  <Input
                    id="focalLength"
                    type="number"
                    value={equipment.focalLength || ""}
                    onChange={(e) => setEquipment((prev) => ({ ...prev, focalLength: Number(e.target.value) }))}
                    placeholder="e.g. 650"
                    className="bg-secondary/30 border-border/50 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="aperture" className="text-xs text-muted-foreground">
                    Aperture (mm)
                  </Label>
                  <Input
                    id="aperture"
                    type="number"
                    value={equipment.aperture || ""}
                    onChange={(e) => setEquipment((prev) => ({ ...prev, aperture: Number(e.target.value) }))}
                    placeholder="e.g. 80"
                    className="bg-secondary/30 border-border/50 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Camera Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" /> Camera / Sensor
              </CardTitle>
              <CardDescription>Select a preset or choose "Custom" to enter specs manually.</CardDescription>
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
                    {CAMERA_PRESETS.map((p) => (
                      <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sensorWidth" className="text-xs text-muted-foreground">
                    Sensor Width (mm)
                  </Label>
                  <Input
                    id="sensorWidth"
                    type="number"
                    step="0.1"
                    value={equipment.sensorWidth || ""}
                    onChange={(e) => setEquipment((prev) => ({ ...prev, sensorWidth: Number(e.target.value) }))}
                    placeholder="e.g. 23.5"
                    className="bg-secondary/30 border-border/50 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="sensorHeight" className="text-xs text-muted-foreground">
                    Sensor Height (mm)
                  </Label>
                  <Input
                    id="sensorHeight"
                    type="number"
                    step="0.1"
                    value={equipment.sensorHeight || ""}
                    onChange={(e) => setEquipment((prev) => ({ ...prev, sensorHeight: Number(e.target.value) }))}
                    placeholder="e.g. 15.7"
                    className="bg-secondary/30 border-border/50 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pixelSize" className="text-xs text-muted-foreground">
                    Pixel Size (µm)
                  </Label>
                  <Input
                    id="pixelSize"
                    type="number"
                    step="0.01"
                    value={equipment.pixelSize || ""}
                    onChange={(e) => setEquipment((prev) => ({ ...prev, pixelSize: Number(e.target.value) }))}
                    placeholder="e.g. 3.76"
                    className="bg-secondary/30 border-border/50 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="cameraType" className="text-xs text-muted-foreground">
                    Camera Type
                  </Label>
                  <Select
                    value={equipment.cameraType}
                    onValueChange={(v) => setEquipment((prev) => ({ ...prev, cameraType: v }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
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
                      <p className="text-lg font-bold font-mono text-foreground">
                        {samplingRate.toFixed(2)}″/px
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {samplingRate < 0.8 ? "Oversampled" : samplingRate < 2.0 ? "Ideal range" : samplingRate < 4.0 ? "Undersampled" : "Very wide"}
                      </p>
                    </div>
                  )}
                  {fovW && fovH && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Field of View</span>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {fovW.toFixed(0)}' × {fovH.toFixed(0)}'
                      </p>
                      <p className="text-[10px] text-muted-foreground">arcminutes</p>
                    </div>
                  )}
                  {fRatio && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">f/ Ratio</span>
                      <p className="text-lg font-bold font-mono text-foreground">
                        f/{fRatio.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {fRatio < 4 ? "Very fast" : fRatio < 6 ? "Fast" : fRatio < 10 ? "Moderate" : "Slow"}
                      </p>
                    </div>
                  )}
                  {equipment.focalLength > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Focal Length</span>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {equipment.focalLength}mm
                      </p>
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
            Stored locally in your browser. Used by the Sky Atlas, FOV Calculator, and Setup Assistant.
          </p>
        </motion.div>

        <ToolSuggestions />
      </main>
    </div>
  );
};

export default EquipmentProfile;
