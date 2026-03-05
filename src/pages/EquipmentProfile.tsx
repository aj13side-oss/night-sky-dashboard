import { useState, useEffect, useMemo } from "react";
import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Telescope, Camera, Save, CheckCircle2, Info, Filter, Anchor, ExternalLink, AlertTriangle, Weight } from "lucide-react";
import { toast } from "sonner";
import {
  useCameras, useTelescopes, useMounts, useFilters,
  type AstroCamera, type AstroTelescope, type AstroMount, type AstroFilter,
} from "@/hooks/useEquipmentCatalog";

const STORAGE_KEY = "astrodash_rig";

interface RigSelection {
  cameraId: string | null;
  telescopeId: string | null;
  mountId: string | null;
  filterId: string | null;
}

const EquipmentProfile = () => {
  const { data: cameras, isLoading: loadingCams } = useCameras();
  const { data: telescopes, isLoading: loadingScopes } = useTelescopes();
  const { data: mounts, isLoading: loadingMounts } = useMounts();
  const { data: filters, isLoading: loadingFilters } = useFilters();

  const [rig, setRig] = useState<RigSelection>({
    cameraId: null, telescopeId: null, mountId: null, filterId: null,
  });
  const [saved, setSaved] = useState(false);

  // Load saved rig
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRig(JSON.parse(raw));
    } catch {}
  }, []);

  const selectedCamera = useMemo(() => cameras?.find(c => c.id === rig.cameraId) ?? null, [cameras, rig.cameraId]);
  const selectedTelescope = useMemo(() => telescopes?.find(t => t.id === rig.telescopeId) ?? null, [telescopes, rig.telescopeId]);
  const selectedMount = useMemo(() => mounts?.find(m => m.id === rig.mountId) ?? null, [mounts, rig.mountId]);
  const selectedFilter = useMemo(() => filters?.find(f => f.id === rig.filterId) ?? null, [filters, rig.filterId]);

  // Also save legacy format for other tools (FOV calc, atlas, etc.)
  const saveLegacyEquipment = (cam: AstroCamera | null, scope: AstroTelescope | null) => {
    const legacy = {
      focalLength: scope?.focal_length_mm ?? 0,
      sensorWidth: cam?.sensor_width_mm ?? 0,
      sensorHeight: cam?.sensor_height_mm ?? 0,
      pixelSize: cam?.pixel_size_um ?? 0,
      cameraType: cam?.is_color ? "Color (OSC)" : "Mono",
      telescopeName: scope ? `${scope.brand} ${scope.model}` : "",
      cameraName: cam ? `${cam.brand} ${cam.model}` : "",
    };
    localStorage.setItem("astrodash_equipment", JSON.stringify(legacy));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rig));
    saveLegacyEquipment(selectedCamera, selectedTelescope);
    setSaved(true);
    toast.success("Rig sauvegardé ! Vos réglages seront utilisés dans tout AstroDash.");
    setTimeout(() => setSaved(false), 2000);
  };

  // Calculations
  const samplingRate = selectedTelescope?.focal_length_mm && selectedCamera?.pixel_size_um
    ? (selectedCamera.pixel_size_um / selectedTelescope.focal_length_mm) * 206.265
    : null;

  const fovW = selectedTelescope?.focal_length_mm && selectedCamera?.sensor_width_mm
    ? (selectedCamera.sensor_width_mm / selectedTelescope.focal_length_mm) * (180 / Math.PI) * 60
    : null;
  const fovH = selectedTelescope?.focal_length_mm && selectedCamera?.sensor_height_mm
    ? (selectedCamera.sensor_height_mm / selectedTelescope.focal_length_mm) * (180 / Math.PI) * 60
    : null;

  // Weight warning
  const totalWeight = (selectedTelescope?.weight_kg ?? 0) + (selectedCamera ? 1 : 0); // rough estimate camera ~1kg
  const overloaded = selectedMount?.payload_kg ? totalWeight > selectedMount.payload_kg * 0.8 : false;

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" />
            Rig Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Assemblez votre setup d'astrophoto. Les specs seront utilisées dans l'Atlas, le FOV et l'assistant.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Telescope */}
          <EquipmentSection
            title="Télescope / Optique"
            icon={<Telescope className="w-5 h-5 text-primary" />}
            description="Votre instrument principal"
            loading={loadingScopes}
            delay={0.1}
          >
            <Select value={rig.telescopeId ?? ""} onValueChange={(v) => setRig(r => ({ ...r, telescopeId: v || null }))}>
              <SelectTrigger className="bg-secondary/30 border-border/50">
                <SelectValue placeholder="Choisir un télescope..." />
              </SelectTrigger>
              <SelectContent>
                {telescopes?.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.brand} {t.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTelescope && (
              <EquipmentDetail
                item={selectedTelescope}
                specs={[
                  { label: "Focale", value: `${selectedTelescope.focal_length_mm}mm` },
                  { label: "Ouverture", value: `${selectedTelescope.aperture_mm}mm` },
                  { label: "f/ratio", value: selectedTelescope.focal_length_mm && selectedTelescope.aperture_mm
                    ? `f/${(selectedTelescope.focal_length_mm / selectedTelescope.aperture_mm).toFixed(1)}`
                    : null },
                  { label: "Type", value: selectedTelescope.type },
                  { label: "Poids", value: selectedTelescope.weight_kg ? `${selectedTelescope.weight_kg}kg` : null },
                ]}
              />
            )}
          </EquipmentSection>

          {/* Camera */}
          <EquipmentSection
            title="Caméra / Capteur"
            icon={<Camera className="w-5 h-5 text-primary" />}
            description="Votre caméra d'imagerie"
            loading={loadingCams}
            delay={0.15}
          >
            <Select value={rig.cameraId ?? ""} onValueChange={(v) => setRig(r => ({ ...r, cameraId: v || null }))}>
              <SelectTrigger className="bg-secondary/30 border-border/50">
                <SelectValue placeholder="Choisir une caméra..." />
              </SelectTrigger>
              <SelectContent>
                {cameras?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.brand} {c.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCamera && (
              <EquipmentDetail
                item={selectedCamera}
                specs={[
                  { label: "Capteur", value: `${selectedCamera.sensor_width_mm}×${selectedCamera.sensor_height_mm}mm` },
                  { label: "Pixel", value: `${selectedCamera.pixel_size_um}µm` },
                  { label: "Type", value: selectedCamera.is_color ? "Couleur (OSC)" : "Mono" },
                ]}
              />
            )}
          </EquipmentSection>

          {/* Mount */}
          <EquipmentSection
            title="Monture"
            icon={<Anchor className="w-5 h-5 text-primary" />}
            description="Le support de votre setup"
            loading={loadingMounts}
            delay={0.2}
          >
            <Select value={rig.mountId ?? ""} onValueChange={(v) => setRig(r => ({ ...r, mountId: v || null }))}>
              <SelectTrigger className="bg-secondary/30 border-border/50">
                <SelectValue placeholder="Choisir une monture..." />
              </SelectTrigger>
              <SelectContent>
                {mounts?.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.brand} {m.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMount && (
              <EquipmentDetail
                item={selectedMount}
                specs={[
                  { label: "Charge max", value: selectedMount.payload_kg ? `${selectedMount.payload_kg}kg` : null },
                  { label: "Poids", value: selectedMount.mount_weight_kg ? `${selectedMount.mount_weight_kg}kg` : null },
                  { label: "Type", value: selectedMount.mount_type },
                ]}
              />
            )}
          </EquipmentSection>

          {/* Filters */}
          <EquipmentSection
            title="Filtre"
            icon={<Filter className="w-5 h-5 text-primary" />}
            description="Filtre principal"
            loading={loadingFilters}
            delay={0.25}
          >
            <Select value={rig.filterId ?? ""} onValueChange={(v) => setRig(r => ({ ...r, filterId: v || null }))}>
              <SelectTrigger className="bg-secondary/30 border-border/50">
                <SelectValue placeholder="Choisir un filtre..." />
              </SelectTrigger>
              <SelectContent>
                {filters?.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.brand} {f.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFilter && (
              <EquipmentDetail
                item={selectedFilter}
                specs={[
                  { label: "Type", value: selectedFilter.type },
                  { label: "Taille", value: selectedFilter.size },
                ]}
              />
            )}
          </EquipmentSection>
        </div>

        {/* Warnings */}
        {overloaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="py-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">
                  <strong>Surcharge !</strong> Le poids estimé ({totalWeight.toFixed(1)}kg) dépasse 80% de la charge max de votre monture ({selectedMount?.payload_kg}kg). Visez max {(selectedMount!.payload_kg! * 0.8).toFixed(1)}kg pour un suivi optimal.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calculated Stats */}
        {(samplingRate || fovW) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> Setup calculé
                </CardTitle>
                <CardDescription>Basé sur votre combinaison télescope + caméra.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {samplingRate && (
                    <StatBlock
                      label="Échantillonnage"
                      value={`${samplingRate.toFixed(2)}″/px`}
                      note={samplingRate < 0.8 ? "Sur-échantillonné" : samplingRate < 2.0 ? "Idéal" : samplingRate < 4.0 ? "Sous-échantillonné" : "Très large"}
                    />
                  )}
                  {fovW && fovH && (
                    <StatBlock label="Champ de vision" value={`${fovW.toFixed(0)}' × ${fovH.toFixed(0)}'`} note="arcminutes" />
                  )}
                  {selectedTelescope?.focal_length_mm && (
                    <StatBlock
                      label="Focale"
                      value={`${selectedTelescope.focal_length_mm}mm`}
                      note={selectedTelescope.focal_length_mm < 400 ? "Grand champ" : selectedTelescope.focal_length_mm < 1000 ? "Polyvalent" : "Longue focale"}
                    />
                  )}
                  {selectedTelescope?.focal_length_mm && selectedTelescope?.aperture_mm && (
                    <StatBlock
                      label="Rapport f/D"
                      value={`f/${(selectedTelescope.focal_length_mm / selectedTelescope.aperture_mm).toFixed(1)}`}
                      note={selectedTelescope.focal_length_mm / selectedTelescope.aperture_mm < 5 ? "Rapide" : "Standard"}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button onClick={handleSave} size="lg" className="w-full gap-2">
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saved ? "Sauvegardé !" : "Sauvegarder mon Rig"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Stocké localement. Utilisé par le Sky Atlas, le calculateur FOV et l'assistant de setup.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

// --- Sub-components ---

function EquipmentSection({ title, icon, description, loading, delay, children }: {
  title: string; icon: React.ReactNode; description: string; loading: boolean; delay: number; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border/50 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">{icon} {title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EquipmentDetail({ item, specs }: {
  item: { image_url?: string | null; affiliate_amazon?: string | null; affiliate_astro?: string | null };
  specs: { label: string; value: string | null | undefined }[];
}) {
  const filteredSpecs = specs.filter(s => s.value);
  return (
    <div className="mt-3 space-y-3">
      {item.image_url && (
        <div className="rounded-lg overflow-hidden bg-secondary/20 flex items-center justify-center h-28">
          <img src={item.image_url} alt="Equipment" className="max-h-full object-contain p-2" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {filteredSpecs.map(s => (
          <Badge key={s.label} variant="secondary" className="text-xs font-mono">
            {s.label}: {s.value}
          </Badge>
        ))}
      </div>
      {(item.affiliate_amazon || item.affiliate_astro) && (
        <div className="flex gap-2">
          {item.affiliate_amazon && (
            <a href={item.affiliate_amazon} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <ExternalLink className="w-3 h-3" /> Amazon
            </a>
          )}
          {item.affiliate_astro && (
            <a href={item.affiliate_astro} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <ExternalLink className="w-3 h-3" /> Astro-shop
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{note}</p>
    </div>
  );
}

export default EquipmentProfile;
