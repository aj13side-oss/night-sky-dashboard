import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRigPresets } from "@/hooks/useEquipmentCatalog";
import { useCameras, useTelescopes, useMounts } from "@/hooks/useEquipmentCatalog";
import { Telescope, Camera, Anchor, Star, Layers } from "lucide-react";

const USE_CASE_LABELS: Record<string, string> = {
  beginner_deepsky: "Ciel profond débutant",
  intermediate_deepsky: "Ciel profond intermédiaire",
  advanced_deepsky: "Ciel profond avancé",
  widefield: "Grand champ",
  narrowband: "Narrowband",
  beginner_planetary: "Planétaire",
  budget: "Budget",
  portable: "Portable / Nomade",
  premium: "Premium",
};

export default function AdminPresets() {
  const { data: presets } = useRigPresets();
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();

  if (!presets) return <p className="text-sm text-muted-foreground mt-4">Chargement...</p>;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {presets.map(preset => {
        const cam = cameras?.find(c => c.id === preset.camera_id);
        const scope = telescopes?.find(t => t.id === preset.telescope_id);
        const mnt = mounts?.find(m => m.id === preset.mount_id);

        return (
          <Card key={preset.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  {preset.name}
                </CardTitle>
                <Badge variant="secondary" className="text-[9px]">
                  {USE_CASE_LABELS[preset.use_case] ?? preset.use_case}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: preset.difficulty_level ?? 1 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {preset.budget_min_eur?.toLocaleString("fr-FR")} – {preset.budget_max_eur?.toLocaleString("fr-FR")}€
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground line-clamp-2">{preset.description_fr}</p>

              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Telescope className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{scope ? `${scope.brand} ${scope.model}` : <span className="text-muted-foreground italic">Non défini</span>}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{cam ? `${cam.brand} ${cam.model}` : <span className="text-muted-foreground italic">Non défini</span>}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Anchor className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{mnt ? `${mnt.brand} ${mnt.model}` : <span className="text-muted-foreground italic">Non défini</span>}</span>
                </div>
              </div>

              {preset.is_featured && <Badge className="text-[8px] bg-primary/20 text-primary">Populaire</Badge>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
