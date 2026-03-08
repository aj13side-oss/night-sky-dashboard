import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Cpu, DollarSign, Wrench } from "lucide-react";
import { extractPrices, useCompatibilityRules } from "@/hooks/useEquipmentCatalog";
import type { AstroTelescope, AstroCamera, AstroMount, AstroFilter, AstroAccessory } from "@/hooks/useEquipmentCatalog";

interface RigSummaryProps {
  telescope: AstroTelescope | null;
  camera: AstroCamera | null;
  mount: AstroMount | null;
  filter: AstroFilter | null;
  accessories?: AstroAccessory[];
}

type CheckStatus = "ok" | "warning" | "error";

interface Check {
  key: string;
  label: string;
  value: string;
  status: CheckStatus;
  msg: string;
}

export function RigSummary({ telescope, camera, mount, filter, accessories = [] }: RigSummaryProps) {
  const { data: rules } = useCompatibilityRules();

  const diagnostics = useMemo(() => {
    if (!telescope && !camera && !mount) return null;

    const checks: Check[] = [];

    const fl = telescope?.focal_length_mm ?? 0;
    const ap = telescope?.aperture_mm ?? 0;
    const px = camera?.pixel_size_um ?? 0;
    const sw = camera?.sensor_width_mm ?? 0;
    const sh = camera?.sensor_height_mm ?? 0;

    const getRule = (key: string) => rules?.find(r => r.rule_key === key && r.is_active);

    // 1. Sampling
    if (fl > 0 && px > 0) {
      const sampling = (px / fl) * 206.265;
      const ruleOver = getRule("sampling_oversampled");
      const ruleUnder = getRule("sampling_undersampled");
      const minOk = ruleOver?.max_value ?? 0.6;
      const maxOk = ruleUnder?.min_value ?? 2.5;
      let status: CheckStatus = "ok";
      let msg = "Optimal for most seeing conditions";
      if (sampling < minOk) {
        status = "warning";
        msg = "Oversampled — very sensitive to seeing / turbulence";
      } else if (sampling > maxOk) {
        status = "warning";
        msg = "Undersampled — risk of pixelated stars";
      }
      checks.push({ key: "sampling", label: "Sampling", value: `${sampling.toFixed(2)}″/px`, status, msg });
    }

    // 2. f/ratio
    if (fl > 0 && ap > 0) {
      const fRatio = fl / ap;
      checks.push({
        key: "fratio", label: "f/ratio", value: `f/${fRatio.toFixed(1)}`,
        status: "ok",
        msg: fRatio < 4 ? "Very fast — short exposures" : fRatio < 6 ? "Fast" : fRatio < 10 ? "Moderate" : "Slow — long exposures needed",
      });
    }

    // 3. Field of view
    if (fl > 0 && sw > 0 && sh > 0) {
      const fovW = (sw / fl) * (180 / Math.PI) * 60;
      const fovH = (sh / fl) * (180 / Math.PI) * 60;
      checks.push({
        key: "fov", label: "Field of View", value: `${fovW.toFixed(0)}' × ${fovH.toFixed(0)}'`,
        status: "ok", msg: "in arcminutes",
      });
    }

    // 4. Sensor vs image circle
    if (sw > 0 && sh > 0 && telescope?.image_circle_mm) {
      const diag = Math.sqrt(sw * sw + sh * sh);
      const ic = telescope.image_circle_mm;
      const ratio = diag / ic;
      const rule = getRule("sensor_vs_image_circle");
      const warnT = rule?.min_value ?? 0.85;
      const errT = rule?.max_value ?? 1.0;
      let status: CheckStatus = "ok";
      let msg = `Sensor diagonal ${diag.toFixed(1)}mm within image circle ${ic}mm`;
      if (ratio > errT) {
        status = "error";
        msg = `Sensor diagonal (${diag.toFixed(1)}mm) exceeds image circle (${ic}mm) — severe vignetting`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Sensor diagonal (${diag.toFixed(1)}mm) close to limit (${ic}mm) — corner vignetting possible`;
      }
      checks.push({ key: "vignetting", label: "Vignetting", value: `${(ratio * 100).toFixed(0)}%`, status, msg });
    }

    // 5. Payload (including accessory weight)
    const teleW = telescope?.weight_kg ?? 0;
    const camW = camera?.weight_kg ?? (camera?.weight_g ? camera.weight_g / 1000 : 0);
    const accW = accessories.reduce((sum, a) => sum + ((a.weight_g ?? 0) / 1000), 0);
    const totalPayload = teleW + camW + accW + (accessories.length > 0 ? 0 : 1);
    if (mount?.payload_kg && mount.payload_kg > 0) {
      const ratio = totalPayload / mount.payload_kg;
      const rule = getRule("payload_ratio");
      const warnT = rule?.min_value ?? 0.50;
      const errT = rule?.max_value ?? 0.65;
      let status: CheckStatus = "ok";
      let msg = `${totalPayload.toFixed(1)}kg / ${mount.payload_kg}kg — within limits`;
      if (ratio > errT) {
        status = "error";
        msg = `Payload ${totalPayload.toFixed(1)}kg exceeds safe limit (${(errT * 100).toFixed(0)}% of ${mount.payload_kg}kg) — tracking instability`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Payload ${totalPayload.toFixed(1)}kg at ${(ratio * 100).toFixed(0)}% of capacity — close to limit`;
      }
      checks.push({ key: "payload", label: "Payload", value: `${totalPayload.toFixed(1)} / ${mount.payload_kg}kg`, status, msg });
    }

    // 6. Backfocus — full optical train
    const reqBF = telescope?.required_backfocus_mm ?? 0;
    const camBF = camera?.internal_backfocus_mm ?? 0;
    if (reqBF > 0 && camBF > 0) {
      const filterCorr = filter?.thickness_mm ? filter.thickness_mm / 3 : 0;
      const accBF = accessories.reduce((sum, a) => sum + (a.optical_length_mm ?? 0), 0);
      const trainBF = camBF + filterCorr + accBF;
      const spacer = reqBF - trainBF;
      const rule = getRule("backfocus_mismatch");
      const warnT = rule?.max_value ?? 5;
      let status: CheckStatus = "ok";

      const trainParts: string[] = [`Camera ${camBF}mm`];
      if (filterCorr > 0) trainParts.push(`Filter ${filterCorr.toFixed(1)}mm`);
      accessories.forEach(a => {
        if (a.optical_length_mm) trainParts.push(`${a.brand} ${a.model} ${a.optical_length_mm}mm`);
      });
      const trainDetail = trainParts.join(" + ");

      let msg = `Train: ${trainDetail} = ${trainBF.toFixed(1)}mm → ${spacer.toFixed(1)}mm spacer needed`;
      if (Math.abs(spacer) > warnT) {
        status = "warning";
        msg = spacer < 0
          ? `Total train (${trainBF.toFixed(1)}mm) exceeds required backfocus (${reqBF}mm) by ${Math.abs(spacer).toFixed(1)}mm`
          : `${spacer.toFixed(1)}mm spacer needed — ${trainDetail}`;
      }
      checks.push({ key: "backfocus", label: "Optical Train (BF)", value: `${spacer.toFixed(1)}mm spacer`, status, msg });
    }

    // 7. Additional specs
    if (camera?.interface_type || camera?.interface_usb) {
      checks.push({ key: "cam_port", label: "Camera Port", value: camera.interface_usb ?? camera.interface_type ?? "", status: "ok", msg: "" });
    }
    if (mount?.connectivity) {
      checks.push({ key: "mnt_port", label: "Mount Port", value: mount.connectivity, status: "ok", msg: "" });
    }
    if (camera?.qe_percent) {
      checks.push({ key: "qe", label: "Quantum Efficiency", value: `${camera.qe_percent}%`, status: "ok", msg: camera.qe_percent >= 80 ? "Excellent" : camera.qe_percent >= 60 ? "Good" : "Average" });
    }
    if (camera?.read_noise_e) {
      checks.push({ key: "readnoise", label: "Read Noise", value: `${camera.read_noise_e}e⁻`, status: "ok", msg: camera.read_noise_e <= 1.5 ? "Very low" : camera.read_noise_e <= 3 ? "Low" : "Moderate" });
    }
    if (mount?.periodic_error_arcsec) {
      checks.push({ key: "pe", label: "Periodic Error", value: `±${mount.periodic_error_arcsec}″`, status: "ok", msg: mount.periodic_error_arcsec <= 5 ? "Excellent" : mount.periodic_error_arcsec <= 15 ? "Good" : "Autoguiding recommended" });
    }

    return checks;
  }, [telescope, camera, mount, filter, accessories, rules]);

  // Estimated total price
  const totalPrice = useMemo(() => {
    let total = 0;
    let count = 0;
    [telescope, camera, mount, filter, ...accessories].forEach(item => {
      if (!item) return;
      const { best } = extractPrices((item as any)._raw ?? {});
      if (best) { total += best.price; count++; }
    });
    return count > 0 ? { total, count } : null;
  }, [telescope, camera, mount, filter, accessories]);

  if (!diagnostics) return null;

  const errors = diagnostics.filter(d => d.status === "error");
  const warnings = diagnostics.filter(d => d.status === "warning");
  const globalScore = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {[...errors, ...warnings].map((a) => (
        <Alert key={a.key} variant={a.status === "error" ? "destructive" : "default"}
          className={a.status === "error" ? "" : "border-accent/40 bg-accent/5"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{a.label}</AlertTitle>
          <AlertDescription className="text-xs">{a.msg}</AlertDescription>
        </Alert>
      ))}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Setup Performance
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalPrice && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/40">
                  <DollarSign className="w-3 h-3" />
                  ~{totalPrice.total.toLocaleString()}€
                  <span className="text-muted-foreground">({totalPrice.count} items)</span>
                </Badge>
              )}
              <Badge
                variant={globalScore === "ok" ? "default" : "destructive"}
                className={globalScore === "ok" ? "bg-green-600/80 hover:bg-green-600" : globalScore === "warning" ? "bg-amber-600/80 hover:bg-amber-600" : ""}
              >
                {globalScore === "ok" ? "✓ Compatible" : globalScore === "warning" ? "⚠ Warning" : "✗ Issues"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {diagnostics.filter(d => d.value).map(d => (
              <StatBlock key={d.key} label={d.label} value={d.value} note={d.msg}
                status={d.status} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBlock({ label, value, note, status }: { label: string; value: string; note: string; status: CheckStatus }) {
  const borderColor = status === "error" ? "border-l-destructive" : status === "warning" ? "border-l-accent" : "border-l-primary/30";
  return (
    <div className={`space-y-1 border-l-2 pl-3 ${borderColor}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}
