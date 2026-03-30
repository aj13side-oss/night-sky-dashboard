import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ChevronDown, Rocket } from "lucide-react";
import { useCompatibilityRules } from "@/hooks/useEquipmentCatalog";
import type {
  AstroTelescope, AstroCamera, AstroMount, AstroFilter, AstroAccessory,
} from "@/hooks/useEquipmentCatalog";

interface ManualTelescope { focalLength: number; aperture: number }
interface ManualCamera { sensorWidth: number; sensorHeight: number; pixelSize: number }

interface MonRigPanelProps {
  telescope: AstroTelescope | null;
  camera: AstroCamera | null;
  mount: AstroMount | null;
  filters: AstroFilter[];
  accessories: AstroAccessory[];
  onClearTelescope: () => void;
  onClearCamera: () => void;
  onClearMount: () => void;
  onRemoveFilter: (id: string) => void;
  onRemoveAccessory: (id: string) => void;
}

export function MonRigPanel({
  telescope, camera, mount, filters, accessories,
  onClearTelescope, onClearCamera, onClearMount, onRemoveFilter, onRemoveAccessory,
}: MonRigPanelProps) {
  const navigate = useNavigate();
  const { data: rules } = useCompatibilityRules();

  const [manualTelescope, setManualTelescope] = useState<ManualTelescope>({ focalLength: 0, aperture: 0 });
  const [manualCamera, setManualCamera] = useState<ManualCamera>({ sensorWidth: 0, sensorHeight: 0, pixelSize: 0 });
  const [showManualScope, setShowManualScope] = useState(false);
  const [showManualCam, setShowManualCam] = useState(false);

  // Effective values (catalog or manual)
  const fl = telescope?.focal_length_mm ?? (manualTelescope.focalLength || 0);
  const ap = telescope?.aperture_mm ?? (manualTelescope.aperture || 0);
  const sw = camera?.sensor_width_mm ?? (manualCamera.sensorWidth || 0);
  const sh = camera?.sensor_height_mm ?? (manualCamera.sensorHeight || 0);
  const px = camera?.pixel_size_um ?? (manualCamera.pixelSize || 0);

  const sampling = fl > 0 && px > 0 ? (px / fl) * 206.265 : 0;
  const fovW = fl > 0 && sw > 0 ? (sw / fl) * 3438 : 0;
  const fovH = fl > 0 && sh > 0 ? (sh / fl) * 3438 : 0;

  // Sampling label from rules
  const samplingLabel = useMemo(() => {
    if (sampling <= 0) return null;
    const ruleOver = rules?.find(r => r.rule_key === "sampling_oversampled" && r.is_active);
    const ruleUnder = rules?.find(r => r.rule_key === "sampling_undersampled" && r.is_active);
    const minOk = ruleOver?.max_value ?? 0.6;
    const maxOk = ruleUnder?.min_value ?? 2.5;
    if (sampling < minOk) return { text: "Oversampled", color: "text-amber-400" };
    if (sampling > maxOk) return { text: "Undersampled", color: "text-amber-400" };
    return { text: "Ideal", color: "text-emerald-400" };
  }, [sampling, rules]);

  // M31 FOV preview
  const fovPreview = useMemo(() => {
    if (fovW <= 0 || fovH <= 0) return null;
    const fovDeg = Math.max(fovW, fovH) / 60;
    const cappedFov = Math.min(10, Math.max(0.5, fovDeg));
    const url = `https://alasky.u-strasbg.fr/hips-image-services/hips2fits?hips=CDS%2FP%2FDSS2%2Fcolor&width=600&height=400&fov=${cappedFov}&ra=10.65&dec=41.27&projection=STG&format=jpg`;
    // Sensor overlay percentage
    const sensorPctW = Math.min(95, (fovW / 60 / cappedFov) * 100);
    const sensorPctH = Math.min(95, (fovH / 60 / cappedFov) * 100);
    return { url, sensorPctW, sensorPctH };
  }, [fovW, fovH]);

  // Compatibility alerts
  const alerts = useMemo(() => {
    if (!rules) return [];
    const triggered: { severity: string; message: string }[] = [];
    const getRule = (key: string) => rules.find(r => r.rule_key === key && r.is_active);

    // Payload
    if (mount?.payload_kg && mount.payload_kg > 0) {
      const teleW = telescope?.weight_kg ?? 0;
      const camW = camera?.weight_g ? camera.weight_g / 1000 : (camera?.weight_kg ?? 0);
      const ratio = (teleW + camW) / mount.payload_kg;
      const ruleErr = getRule("payload_ratio");
      const ruleWarn = getRule("payload_ratio_warning");
      if (ruleErr && ratio > ruleErr.max_value) triggered.push({ severity: "error", message: ruleErr.message_en });
      else if (ruleWarn && ratio > ruleWarn.min_value) triggered.push({ severity: "warning", message: ruleWarn.message_en });
    }

    // Sampling
    if (sampling > 0) {
      const ruleUnder = getRule("sampling_undersampled");
      const ruleOver = getRule("sampling_oversampled");
      const ruleIdeal = getRule("sampling_ideal_deep_sky");
      if (ruleUnder && sampling > ruleUnder.max_value) triggered.push({ severity: "warning", message: ruleUnder.message_en });
      else if (ruleOver && sampling < ruleOver.max_value) triggered.push({ severity: "warning", message: ruleOver.message_en });
      else if (ruleIdeal && sampling >= ruleIdeal.min_value && sampling <= ruleIdeal.max_value) triggered.push({ severity: "info", message: ruleIdeal.message_en });
    }

    // Sensor vs image circle
    if (sw > 0 && sh > 0 && telescope?.image_circle_mm) {
      const diag = Math.sqrt(sw * sw + sh * sh);
      const ic = telescope.image_circle_mm;
      const ruleVig = getRule("sensor_vs_image_circle");
      const ruleWarn = getRule("sensor_illumination_warning");
      if (ruleVig && diag / ic > ruleVig.max_value) triggered.push({ severity: "error", message: ruleVig.message_en });
      else if (ruleWarn && diag / ic > (ruleWarn.min_value ?? 0.85)) triggered.push({ severity: "warning", message: ruleWarn.message_en });
    }

    // FOV too narrow / very wide
    if (fovW > 0) {
      const ruleNarrow = getRule("fov_too_narrow");
      const ruleWide = getRule("fov_very_wide");
      if (ruleNarrow && fovW < (ruleNarrow.max_value ?? 15)) triggered.push({ severity: "info", message: ruleNarrow.message_en });
      if (ruleWide && fovW > (ruleWide.min_value ?? 300)) triggered.push({ severity: "info", message: ruleWide.message_en });
    }

    // Backfocus
    const reqBF = telescope?.required_backfocus_mm ?? 0;
    const camBF = camera?.internal_backfocus_mm ?? 0;
    if (reqBF > 0 && camBF > 0) {
      const diff = Math.abs(camBF - reqBF);
      const ruleBF = getRule("backfocus_mismatch");
      if (ruleBF && diff > (ruleBF.max_value ?? 5)) triggered.push({ severity: "warning", message: ruleBF.message_en });
    }

    return triggered;
  }, [telescope, camera, mount, rules, sampling, fovW, sw, sh]);

  const hasRig = telescope || camera || mount || (fl > 0 && !telescope) || (sw > 0 && !camera);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#FFB347" }}>🔭 My Rig</h2>

      {/* OPTIQUE slot */}
      <SlotCard
        label="OPTICS"
        item={telescope ? `${telescope.brand} ${telescope.model}` : null}
        onClear={onClearTelescope}
        showManual={!telescope && showManualScope}
        onToggleManual={() => setShowManualScope(v => !v)}
        manualContent={
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Focal (mm)</Label>
              <Input type="number" value={manualTelescope.focalLength || ""} className="h-7 text-xs bg-secondary/30 border-border/50 font-mono"
                onChange={e => setManualTelescope(p => ({ ...p, focalLength: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Aperture (mm)</Label>
              <Input type="number" value={manualTelescope.aperture || ""} className="h-7 text-xs bg-secondary/30 border-border/50 font-mono"
                onChange={e => setManualTelescope(p => ({ ...p, aperture: Number(e.target.value) }))} />
            </div>
          </div>
        }
      />

      {/* CAMERA slot */}
      <SlotCard
        label="CAMERA"
        item={camera ? `${camera.brand} ${camera.model}` : null}
        onClear={onClearCamera}
        showManual={!camera && showManualCam}
        onToggleManual={() => setShowManualCam(v => !v)}
        manualContent={
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">W (mm)</Label>
              <Input type="number" step="0.1" value={manualCamera.sensorWidth || ""} className="h-7 text-xs bg-secondary/30 border-border/50 font-mono"
                onChange={e => setManualCamera(p => ({ ...p, sensorWidth: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">H (mm)</Label>
              <Input type="number" step="0.1" value={manualCamera.sensorHeight || ""} className="h-7 text-xs bg-secondary/30 border-border/50 font-mono"
                onChange={e => setManualCamera(p => ({ ...p, sensorHeight: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Px (µm)</Label>
              <Input type="number" step="0.01" value={manualCamera.pixelSize || ""} className="h-7 text-xs bg-secondary/30 border-border/50 font-mono"
                onChange={e => setManualCamera(p => ({ ...p, pixelSize: Number(e.target.value) }))} />
            </div>
          </div>
        }
      />

      {/* MOUNT slot */}
      <SlotCard label="MOUNT" item={mount ? `${mount.brand} ${mount.model}` : null} onClear={onClearMount} />

      {/* FILTERS */}
      <div className="rounded-lg border border-border/50 p-3">
        <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Filters</span>
        {filters.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {filters.map(f => (
              <Badge key={f.id} variant="secondary" className="text-[10px] gap-1 pr-1">
                {f.brand} {f.model}
                <button onClick={() => onRemoveFilter(f.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        ) : <p className="text-[10px] text-muted-foreground italic mt-1">None</p>}
      </div>

      {/* ACCESSORIES */}
      <div className="rounded-lg border border-border/50 p-3">
        <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Accessories</span>
        {accessories.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {accessories.map(a => (
              <Badge key={a.id} variant="secondary" className="text-[10px] gap-1 pr-1">
                {a.brand} {a.model}
                <button onClick={() => onRemoveAccessory(a.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        ) : <p className="text-[10px] text-muted-foreground italic mt-1">None</p>}
      </div>

      {/* CALCULATED SETUP */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-muted-foreground block">Sampling</span>
              <p className="text-sm font-bold font-mono text-foreground">{sampling > 0 ? `${sampling.toFixed(2)}″/px` : "—"}</p>
              {samplingLabel && <span className={`text-[9px] ${samplingLabel.color}`}>{samplingLabel.text}</span>}
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">FOV</span>
              <p className="text-sm font-bold font-mono text-foreground">{fovW > 0 ? `${fovW.toFixed(0)}'×${fovH.toFixed(0)}'` : "—"}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Focal Length</span>
              <p className="text-sm font-bold font-mono text-foreground">{fl > 0 ? `${fl}mm` : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* M31 PREVIEW */}
      <div className="rounded-lg overflow-hidden border border-border/50">
        {fovPreview ? (
          <div className="relative" style={{ height: 160 }}>
            <img src={fovPreview.url} alt="M31 FOV preview" className="w-full h-full object-cover" loading="lazy" />
            <div
              className="absolute border-2 border-white/70 rounded-sm"
              style={{
                width: `${fovPreview.sensorPctW}%`,
                height: `${fovPreview.sensorPctH}%`,
                left: `${50 - fovPreview.sensorPctW / 2}%`,
                top: `${50 - fovPreview.sensorPctH / 2}%`,
              }}
            />
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center bg-secondary/10">
            <p className="text-[10px] text-muted-foreground italic text-center px-4">
              Configure your rig to see the framing preview
            </p>
          </div>
        )}
        <p className="text-[9px] text-muted-foreground text-center py-1">M31 — Andromeda Galaxy (190'×60')</p>
      </div>

      {/* COMPATIBILITY ALERTS */}
      {hasRig && (
        <div className="space-y-1">
          {alerts.length === 0 && (telescope || camera) && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">✓ Rig compatible</Badge>
          )}
          {alerts.map((a, i) => (
            <Badge
              key={i}
              className={`text-[10px] block w-full text-left whitespace-normal py-1 ${
                a.severity === "error" ? "bg-destructive/20 text-destructive border-destructive/30" :
                a.severity === "warning" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
            >
              {a.message}
            </Badge>
          ))}
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full gap-2 font-semibold"
        style={{ backgroundColor: "#FFB347", color: "#0A1128" }}
        disabled={fovW <= 0}
        onClick={() => {
          const minSize = Math.round(fovW * 0.15);
          const maxSize = Math.round(fovW);
          navigate(`/sky-atlas?minSize=${minSize}&maxSize=${maxSize}`);
        }}
      >
        <Rocket className="w-4 h-4" />
        Trouver des cibles pour ce rig →
      </Button>
    </div>
  );
}

// Slot card sub-component
function SlotCard({ label, item, onClear, showManual, onToggleManual, manualContent }: {
  label: string;
  item: string | null;
  onClear: () => void;
  showManual?: boolean;
  onToggleManual?: () => void;
  manualContent?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-3 ${item ? "border-primary/40 bg-primary/5" : "border-dashed border-border/50"}`}>
      <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">{label}</span>
      {item ? (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-medium text-foreground truncate">{item}</span>
          <button onClick={onClear} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-1">
          <p className="text-[10px] text-muted-foreground italic">Sélectionner dans le catalogue</p>
          {onToggleManual && (
            <>
              <button onClick={onToggleManual} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1">
                <ChevronDown className={`w-3 h-3 transition-transform ${showManual ? "rotate-180" : ""}`} />
                Saisir manuellement
              </button>
              {showManual && manualContent}
            </>
          )}
        </div>
      )}
    </div>
  );
}
