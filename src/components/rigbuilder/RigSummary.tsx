import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, DollarSign, Save } from "lucide-react";
import { extractPrices, useCompatibilityRules } from "@/hooks/useEquipmentCatalog";
import type { AstroTelescope, AstroCamera, AstroMount, AstroFilter, AstroAccessory } from "@/hooks/useEquipmentCatalog";
import { SamplingGauge } from "./SamplingGauge";
import { FovComparator } from "./FovComparator";
import { CompatibilityScore } from "./CompatibilityScore";
import { SaveRigDialog } from "./SaveRigDialog";

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
  const [saveOpen, setSaveOpen] = useState(false);

  const fl = telescope?.focal_length_mm ?? 0;
  const ap = telescope?.aperture_mm ?? 0;
  const px = camera?.pixel_size_um ?? 0;
  const sw = camera?.sensor_width_mm ?? 0;
  const sh = camera?.sensor_height_mm ?? 0;

  const sampling = fl > 0 && px > 0 ? (px / fl) * 206.265 : 0;
  const fovWArcmin = fl > 0 && sw > 0 ? (sw / fl) * 3438 : 0;
  const fovHArcmin = fl > 0 && sh > 0 ? (sh / fl) * 3438 : 0;
  const dawes = ap > 0 ? 116 / ap : 0;

  const diagnostics = useMemo(() => {
    if (!telescope && !camera && !mount) return null;

    const checks: Check[] = [];
    const getRule = (key: string) => rules?.find(r => r.rule_key === key && r.is_active);

    // 1. Sampling
    if (sampling > 0) {
      const ruleOver = getRule("sampling_oversampled");
      const ruleUnder = getRule("sampling_undersampled");
      const minOk = ruleOver?.max_value ?? 0.6;
      const maxOk = ruleUnder?.min_value ?? 2.5;
      let status: CheckStatus = "ok";
      let msg = ruleOver?.message_fr && ruleUnder?.message_fr
        ? "Échantillonnage optimal pour le ciel profond"
        : "Optimal for most seeing conditions";
      if (sampling < minOk) {
        status = "warning";
        msg = ruleOver?.message_fr ?? "Sur-échantillonné — sensible au seeing";
      } else if (sampling > maxOk) {
        status = "warning";
        msg = ruleUnder?.message_fr ?? "Sous-échantillonné — risque de pixelisation";
      }
      checks.push({ key: "sampling", label: "Sampling", value: `${sampling.toFixed(2)}″/px`, status, msg });
    }

    // 2. f/ratio
    if (fl > 0 && ap > 0) {
      const fRatio = fl / ap;
      checks.push({
        key: "fratio", label: "f/ratio", value: `f/${fRatio.toFixed(1)}`,
        status: "ok",
        msg: fRatio < 4 ? "Très rapide — poses courtes" : fRatio < 6 ? "Rapide" : fRatio < 10 ? "Modéré" : "Lent — poses longues nécessaires",
      });
    }

    // 3. Field of view
    if (fovWArcmin > 0 && fovHArcmin > 0) {
      checks.push({
        key: "fov", label: "Champ de vue", value: `${fovWArcmin.toFixed(0)}' × ${fovHArcmin.toFixed(0)}'`,
        status: "ok", msg: "en minutes d'arc",
      });
    }

    // 4. Dawes limit
    if (dawes > 0) {
      const effectiveRes = sampling > 0 ? Math.max(sampling, dawes) : dawes;
      let msg = `Limite de Dawes: ${dawes.toFixed(2)}″`;
      if (sampling > 0) {
        if (sampling > dawes * 2) {
          msg = "Résolution limitée par l'échantillonnage, pas par l'optique";
        } else if (sampling < dawes * 0.5) {
          msg = "Résolution limitée par l'optique — sur-échantillonné";
        } else {
          msg = "Bon équilibre optique/échantillonnage";
        }
      }
      checks.push({
        key: "dawes", label: "Résolution", value: `${effectiveRes.toFixed(2)}″`,
        status: "ok", msg,
      });
    }

    // 5. Sensor vs image circle
    if (sw > 0 && sh > 0 && telescope?.image_circle_mm) {
      const diag = Math.sqrt(sw * sw + sh * sh);
      const ic = telescope.image_circle_mm;
      const ratio = diag / ic;
      const rule = getRule("sensor_vs_image_circle");
      const warnT = rule?.min_value ?? 0.85;
      const errT = rule?.max_value ?? 1.0;
      let status: CheckStatus = "ok";
      let msg = rule?.message_fr
        ? `Diagonale capteur ${diag.toFixed(1)}mm dans le cercle image ${ic}mm`
        : `Sensor diagonal ${diag.toFixed(1)}mm within image circle ${ic}mm`;
      if (ratio > errT) {
        status = "error";
        msg = rule?.message_fr ?? `Diagonale capteur (${diag.toFixed(1)}mm) dépasse le cercle image (${ic}mm) — vignetage sévère`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Diagonale capteur (${diag.toFixed(1)}mm) proche de la limite (${ic}mm) — vignetage possible`;
      }
      checks.push({ key: "vignetting", label: "Vignetage", value: `${(ratio * 100).toFixed(0)}%`, status, msg });
    }

    // 6. Payload
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
      let msg = `${totalPayload.toFixed(1)}kg / ${mount.payload_kg}kg — dans les limites`;
      if (ratio > errT) {
        status = "error";
        msg = rule?.message_fr ?? `Charge ${totalPayload.toFixed(1)}kg dépasse la limite sûre — instabilité de suivi`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Charge ${totalPayload.toFixed(1)}kg à ${(ratio * 100).toFixed(0)}% de la capacité — proche de la limite`;
      }
      checks.push({ key: "payload", label: "Charge", value: `${totalPayload.toFixed(1)} / ${mount.payload_kg}kg`, status, msg });
    }

    // 7. Backfocus
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

      const trainParts: string[] = [`Caméra ${camBF}mm`];
      if (filterCorr > 0) trainParts.push(`Filtre ${filterCorr.toFixed(1)}mm`);
      accessories.forEach(a => {
        if (a.optical_length_mm) trainParts.push(`${a.brand} ${a.model} ${a.optical_length_mm}mm`);
      });
      const trainDetail = trainParts.join(" + ");

      let msg = `Train: ${trainDetail} = ${trainBF.toFixed(1)}mm → entretoise de ${spacer.toFixed(1)}mm`;
      if (Math.abs(spacer) > warnT) {
        status = "warning";
        msg = spacer < 0
          ? `Train optique (${trainBF.toFixed(1)}mm) dépasse le backfocus requis (${reqBF}mm) de ${Math.abs(spacer).toFixed(1)}mm`
          : `Entretoise de ${spacer.toFixed(1)}mm nécessaire — ${trainDetail}`;
      }
      checks.push({ key: "backfocus", label: "Train optique (BF)", value: `${spacer.toFixed(1)}mm`, status, msg });
    }

    // 8. Additional specs
    if (camera?.interface_type || camera?.interface_usb) {
      checks.push({ key: "cam_port", label: "Port caméra", value: camera.interface_usb ?? camera.interface_type ?? "", status: "ok", msg: "" });
    }
    if (mount?.connectivity) {
      checks.push({ key: "mnt_port", label: "Port monture", value: mount.connectivity, status: "ok", msg: "" });
    }
    if (camera?.qe_percent) {
      checks.push({ key: "qe", label: "Efficacité quantique", value: `${camera.qe_percent}%`, status: "ok", msg: camera.qe_percent >= 80 ? "Excellent" : camera.qe_percent >= 60 ? "Bon" : "Moyen" });
    }
    if (camera?.read_noise_e) {
      checks.push({ key: "readnoise", label: "Bruit de lecture", value: `${camera.read_noise_e}e⁻`, status: "ok", msg: camera.read_noise_e <= 1.5 ? "Très bas" : camera.read_noise_e <= 3 ? "Bas" : "Modéré" });
    }
    if (mount?.periodic_error_arcsec) {
      checks.push({ key: "pe", label: "Erreur périodique", value: `±${mount.periodic_error_arcsec}″`, status: "ok", msg: mount.periodic_error_arcsec <= 5 ? "Excellent" : mount.periodic_error_arcsec <= 15 ? "Bon" : "Autoguidage recommandé" });
    }

    return checks;
  }, [telescope, camera, mount, filter, accessories, rules, sampling, fovWArcmin, fovHArcmin, dawes, fl, ap, sw, sh]);

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

  // Cached calculations for save
  const cachedCalculations = useMemo(() => ({
    sampling: sampling > 0 ? sampling.toFixed(2) : null,
    fov: fovWArcmin > 0 ? `${fovWArcmin.toFixed(0)}'×${fovHArcmin.toFixed(0)}'` : null,
    score: diagnostics ? Math.max(0, Math.min(100, 100 - diagnostics.filter(d => d.status === "error").length * 25 - diagnostics.filter(d => d.status === "warning").length * 10)) : null,
    totalPrice: totalPrice?.total ?? null,
  }), [sampling, fovWArcmin, fovHArcmin, diagnostics, totalPrice]);

  if (!diagnostics) return null;

  const errors = diagnostics.filter(d => d.status === "error");
  const warnings = diagnostics.filter(d => d.status === "warning");

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Performance du setup
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {totalPrice && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/40">
                  <DollarSign className="w-3 h-3" />
                  ~{totalPrice.total.toLocaleString()}€
                  <span className="text-muted-foreground">({totalPrice.count})</span>
                </Badge>
              )}
              <CompatibilityScore errors={errors.length} warnings={warnings.length} />
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10"
                onClick={() => setSaveOpen(true)}>
                <Save className="w-3 h-3" /> Sauvegarder
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {diagnostics.filter(d => d.value).map(d => (
              <StatBlock key={d.key} label={d.label} value={d.value} note={d.msg} status={d.status} />
            ))}
          </div>

          {/* Sampling Gauge */}
          {sampling > 0 && (
            <div className="border-t border-border/30 pt-4">
              <SamplingGauge sampling={sampling} />
            </div>
          )}

          {/* FOV Comparator */}
          {fovWArcmin > 0 && fovHArcmin > 0 && (
            <div className="border-t border-border/30 pt-4">
              <FovComparator fovWArcmin={fovWArcmin} fovHArcmin={fovHArcmin} />
            </div>
          )}
        </CardContent>
      </Card>

      <SaveRigDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        telescopeId={telescope?.id ?? null}
        cameraId={camera?.id ?? null}
        mountId={mount?.id ?? null}
        filterIds={filter ? [filter.id] : null}
        accessoryIds={accessories.length > 0 ? accessories.map(a => a.id) : null}
        cachedCalculations={cachedCalculations}
      />
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
