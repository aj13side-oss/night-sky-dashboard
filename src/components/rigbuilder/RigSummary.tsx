import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Cpu } from "lucide-react";
import type { AstroTelescope, AstroCamera, AstroMount, AstroFilter } from "@/hooks/useEquipmentCatalog";

interface RigSummaryProps {
  telescope: AstroTelescope | null;
  camera: AstroCamera | null;
  mount: AstroMount | null;
  filter: AstroFilter | null;
}

export function RigSummary({ telescope, camera, mount, filter }: RigSummaryProps) {
  if (!telescope && !camera && !mount) return null;

  const fl = telescope?.focal_length_mm ?? 0;
  const ap = telescope?.aperture_mm ?? 0;
  const px = camera?.pixel_size_um ?? 0;
  const sw = camera?.sensor_width_mm ?? 0;
  const sh = camera?.sensor_height_mm ?? 0;

  // Sampling
  const sampling = fl > 0 && px > 0 ? (px / fl) * 206.265 : null;

  // FOV
  const fovW = fl > 0 && sw > 0 ? (sw / fl) * (180 / Math.PI) * 60 : null;
  const fovH = fl > 0 && sh > 0 ? (sh / fl) * (180 / Math.PI) * 60 : null;

  // f/ratio
  const fRatio = fl > 0 && ap > 0 ? fl / ap : null;

  // Weight check
  const telescopeWeight = telescope?.weight_kg ?? 0;
  const cameraWeight = camera?.weight_kg ?? 0;
  const totalPayload = telescopeWeight + cameraWeight + 1; // +1kg accessories
  const mountPayload = mount?.payload_kg ?? 0;
  const overloaded = mountPayload > 0 && totalPayload > mountPayload * 0.7;

  // Backfocus
  const requiredBF = telescope?.required_backfocus_mm ?? 0;
  const cameraBF = camera?.internal_backfocus_mm ?? 0;
  const filterCorrection = filter?.thickness_mm ? filter.thickness_mm / 3 : 0;
  const spacerNeeded = requiredBF > 0 && cameraBF > 0 ? requiredBF - cameraBF - filterCorrection : null;

  // Vignetting
  const sensorDiag = sw > 0 && sh > 0 ? Math.sqrt(sw * sw + sh * sh) : 0;
  const imageCircle = telescope?.image_circle_mm ?? 0;
  const vignetting = imageCircle > 0 && sensorDiag > imageCircle;

  // Connectivity
  const cameraInterface = camera?.interface_type;
  const mountInterface = mount?.connectivity;

  const alerts: { type: "warning" | "error"; title: string; msg: string }[] = [];

  if (overloaded) {
    alerts.push({
      type: "warning",
      title: "Mount overloaded",
      msg: `Total payload ~${totalPayload.toFixed(1)}kg exceeds 70% of mount capacity (${mountPayload}kg). Expect tracking instability.`,
    });
  }

  if (sampling !== null) {
    if (sampling < 0.6) {
      alerts.push({ type: "warning", title: "Over-sampled", msg: `Sampling ${sampling.toFixed(2)}″/px — very sensitive to seeing/turbulence.` });
    } else if (sampling > 2.5) {
      alerts.push({ type: "warning", title: "Under-sampled", msg: `Sampling ${sampling.toFixed(2)}″/px — risk of blocky stars and lost detail.` });
    }
  }

  if (vignetting) {
    alerts.push({
      type: "error",
      title: "Vignetting risk",
      msg: `Sensor diagonal (${sensorDiag.toFixed(1)}mm) exceeds telescope image circle (${imageCircle}mm). Expect dark corners.`,
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {alerts.map((a, i) => (
        <Alert key={i} variant={a.type === "error" ? "destructive" : "default"} className="border-yellow-500/40 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{a.title}</AlertTitle>
          <AlertDescription className="text-xs">{a.msg}</AlertDescription>
        </Alert>
      ))}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Rig Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sampling !== null && (
              <StatBlock label="Sampling" value={`${sampling.toFixed(2)}″/px`}
                note={sampling < 0.6 ? "Over-sampled" : sampling <= 2.5 ? "Good range" : "Under-sampled"} />
            )}
            {fRatio !== null && (
              <StatBlock label="f/ Ratio" value={`f/${fRatio.toFixed(1)}`}
                note={fRatio < 4 ? "Very fast" : fRatio < 6 ? "Fast" : fRatio < 10 ? "Moderate" : "Slow"} />
            )}
            {fovW !== null && fovH !== null && (
              <StatBlock label="Field of View" value={`${fovW.toFixed(0)}' × ${fovH.toFixed(0)}'`} note="arcminutes" />
            )}
            {mountPayload > 0 && (
              <StatBlock label="Payload" value={`${totalPayload.toFixed(1)} / ${mountPayload}kg`}
                note={overloaded ? "⚠️ Over 70%" : "✅ Within limits"} />
            )}
            {spacerNeeded !== null && (
              <StatBlock label="Backfocus spacer" value={`${spacerNeeded.toFixed(1)}mm`}
                note={spacerNeeded < 0 ? "⚠️ Too much backfocus" : "Spacer ring needed"} />
            )}
            {cameraInterface && (
              <StatBlock label="Camera port" value={cameraInterface} note="" />
            )}
            {mountInterface && (
              <StatBlock label="Mount port" value={mountInterface} note="" />
            )}
            {camera?.qe_percent && (
              <StatBlock label="Quantum Efficiency" value={`${camera.qe_percent}%`} note="" />
            )}
            {camera?.read_noise_e && (
              <StatBlock label="Read Noise" value={`${camera.read_noise_e}e⁻`} note="" />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBlock({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}
