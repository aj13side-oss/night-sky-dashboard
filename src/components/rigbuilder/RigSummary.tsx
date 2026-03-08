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

    // Helper to get rule by key
    const getRule = (key: string) => rules?.find(r => r.rule_key === key && r.is_active);

    // 1. Échantillonnage
    if (fl > 0 && px > 0) {
      const sampling = (px / fl) * 206.265;
      const ruleOver = getRule("sampling_oversampled");
      const ruleUnder = getRule("sampling_undersampled");
      const minOk = ruleOver?.max_value ?? 0.6;   // below this → oversampled
      const maxOk = ruleUnder?.min_value ?? 2.5;   // above this → undersampled
      let status: CheckStatus = "ok";
      let msg = "Optimal pour la plupart des conditions de seeing";
      if (sampling < minOk) {
        status = "warning";
        msg = "Sur-échantillonné — très sensible au seeing / turbulence";
      } else if (sampling > maxOk) {
        status = "warning";
        msg = "Sous-échantillonné — risque d'étoiles pixelisées";
      }
      checks.push({ key: "sampling", label: "Échantillonnage", value: `${sampling.toFixed(2)}″/px`, status, msg });
    }

    // 2. Rapport f/D
    if (fl > 0 && ap > 0) {
      const fRatio = fl / ap;
      checks.push({
        key: "fratio", label: "Rapport f/D", value: `f/${fRatio.toFixed(1)}`,
        status: "ok",
        msg: fRatio < 4 ? "Très rapide — poses courtes" : fRatio < 6 ? "Rapide" : fRatio < 10 ? "Modéré" : "Lent — poses longues nécessaires",
      });
    }

    // 3. Champ de vision
    if (fl > 0 && sw > 0 && sh > 0) {
      const fovW = (sw / fl) * (180 / Math.PI) * 60;
      const fovH = (sh / fl) * (180 / Math.PI) * 60;
      checks.push({
        key: "fov", label: "Champ de vision", value: `${fovW.toFixed(0)}' × ${fovH.toFixed(0)}'`,
        status: "ok", msg: "en arcminutes",
      });
    }

    // 4. Capteur vs cercle d'image
    if (sw > 0 && sh > 0 && telescope?.image_circle_mm) {
      const diag = Math.sqrt(sw * sw + sh * sh);
      const ic = telescope.image_circle_mm;
      const ratio = diag / ic;
      const rule = getRule("sensor_vs_image_circle");
      const warnT = rule?.min_value ?? 0.85;
      const errT = rule?.max_value ?? 1.0;
      let status: CheckStatus = "ok";
      let msg = `Diagonale capteur ${diag.toFixed(1)}mm dans le cercle image ${ic}mm`;
      if (ratio > errT) {
        status = "error";
        msg = `Diagonale capteur (${diag.toFixed(1)}mm) dépasse le cercle image (${ic}mm) — vignetage sévère`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Diagonale capteur (${diag.toFixed(1)}mm) proche de la limite (${ic}mm) — vignetage en coins possible`;
      }
      checks.push({ key: "vignetting", label: "Vignetage", value: `${(ratio * 100).toFixed(0)}%`, status, msg });
    }

    // 5. Charge utile (incluant poids accessoires)
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
        msg = `Charge ${totalPayload.toFixed(1)}kg dépasse la limite sûre (${(errT * 100).toFixed(0)}% de ${mount.payload_kg}kg) — instabilité de suivi`;
      } else if (ratio > warnT) {
        status = "warning";
        msg = `Charge ${totalPayload.toFixed(1)}kg à ${(ratio * 100).toFixed(0)}% de la capacité — proche de la limite`;
      }
      checks.push({ key: "payload", label: "Charge utile", value: `${totalPayload.toFixed(1)} / ${mount.payload_kg}kg`, status, msg });
    }

    // 6. Backfocus — train optique complet
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

      let msg = `Train : ${trainDetail} = ${trainBF.toFixed(1)}mm → Spacer de ${spacer.toFixed(1)}mm nécessaire`;
      if (Math.abs(spacer) > warnT) {
        status = "warning";
        msg = spacer < 0
          ? `Train total (${trainBF.toFixed(1)}mm) dépasse le backfocus requis (${reqBF}mm) de ${Math.abs(spacer).toFixed(1)}mm`
          : `Spacer de ${spacer.toFixed(1)}mm nécessaire — ${trainDetail}`;
      }
      checks.push({ key: "backfocus", label: "Train optique (BF)", value: `${spacer.toFixed(1)}mm spacer`, status, msg });
    }

    // 7. Specs additionnelles
    if (camera?.interface_type || camera?.interface_usb) {
      checks.push({ key: "cam_port", label: "Port caméra", value: camera.interface_usb ?? camera.interface_type ?? "", status: "ok", msg: "" });
    }
    if (mount?.connectivity) {
      checks.push({ key: "mnt_port", label: "Port monture", value: mount.connectivity, status: "ok", msg: "" });
    }
    if (camera?.qe_percent) {
      checks.push({ key: "qe", label: "Rendement quantique", value: `${camera.qe_percent}%`, status: "ok", msg: camera.qe_percent >= 80 ? "Excellent" : camera.qe_percent >= 60 ? "Bon" : "Moyen" });
    }
    if (camera?.read_noise_e) {
      checks.push({ key: "readnoise", label: "Bruit de lecture", value: `${camera.read_noise_e}e⁻`, status: "ok", msg: camera.read_noise_e <= 1.5 ? "Très faible" : camera.read_noise_e <= 3 ? "Faible" : "Modéré" });
    }
    if (mount?.periodic_error_arcsec) {
      checks.push({ key: "pe", label: "Erreur périodique", value: `±${mount.periodic_error_arcsec}″`, status: "ok", msg: mount.periodic_error_arcsec <= 5 ? "Excellent" : mount.periodic_error_arcsec <= 15 ? "Bon" : "Autoguidage recommandé" });
    }

    return checks;
  }, [telescope, camera, mount, filter, accessories, rules]);

  // Prix total estimé
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
              <Cpu className="w-5 h-5 text-primary" /> Performance du setup
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalPrice && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/40">
                  <DollarSign className="w-3 h-3" />
                  ~{totalPrice.total.toLocaleString("fr-FR")}€
                  <span className="text-muted-foreground">({totalPrice.count} éléments)</span>
                </Badge>
              )}
              <Badge
                variant={globalScore === "ok" ? "default" : "destructive"}
                className={globalScore === "ok" ? "bg-green-600/80 hover:bg-green-600" : globalScore === "warning" ? "bg-amber-600/80 hover:bg-amber-600" : ""}
              >
                {globalScore === "ok" ? "✓ Compatible" : globalScore === "warning" ? "⚠ Attention" : "✗ Problèmes"}
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
