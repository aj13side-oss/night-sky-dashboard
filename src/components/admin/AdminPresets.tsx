import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRigPresets } from "@/hooks/useEquipmentCatalog";
import { useCameras, useTelescopes, useMounts } from "@/hooks/useEquipmentCatalog";
import { Telescope, Camera, Anchor, Star, Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import PresetEditDialog from "./PresetEditDialog";

const USE_CASE_LABELS: Record<string, string> = {
  beginner_deepsky: "Beginner Deep Sky",
  intermediate_deepsky: "Intermediate Deep Sky",
  advanced_deepsky: "Advanced Deep Sky",
  widefield: "Widefield",
  narrowband: "Narrowband",
  beginner_planetary: "Planetary",
  budget: "Budget",
  portable: "Portable",
  premium: "Premium",
};

export default function AdminPresets() {
  const qc = useQueryClient();
  const { data: presets } = useRigPresets();
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const [editPreset, setEditPreset] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletePreset, setDeletePreset] = useState<any | null>(null);

  const handleDelete = async () => {
    if (!deletePreset) return;
    const { error } = await (supabase as any).from("rig_presets").delete().eq("id", deletePreset.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Preset "${deletePreset.name}" deleted`);
    qc.invalidateQueries({ queryKey: ["rig_presets"] });
    setDeletePreset(null);
  };

  if (!presets) return <p className="text-sm text-muted-foreground mt-4">Loading...</p>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{presets.length} presets</span>
        <Button size="sm" onClick={() => { setEditPreset(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Preset
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[9px]">
                      {USE_CASE_LABELS[preset.use_case] ?? preset.use_case}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditPreset(preset); setDialogOpen(true); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeletePreset(preset)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: preset.difficulty_level ?? 1 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {preset.budget_min_eur?.toLocaleString("en-US")} – {preset.budget_max_eur?.toLocaleString("en-US")}€
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground line-clamp-2">{preset.description_fr}</p>

                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Telescope className="w-3 h-3 text-primary" />
                    <span className="text-foreground">{scope ? `${scope.brand} ${scope.model}` : <span className="text-muted-foreground italic">Not set</span>}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-primary" />
                    <span className="text-foreground">{cam ? `${cam.brand} ${cam.model}` : <span className="text-muted-foreground italic">Not set</span>}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Anchor className="w-3 h-3 text-primary" />
                    <span className="text-foreground">{mnt ? `${mnt.brand} ${mnt.model}` : <span className="text-muted-foreground italic">Not set</span>}</span>
                  </div>
                </div>

                {preset.is_featured && <Badge className="text-[8px] bg-primary/20 text-primary">Featured</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PresetEditDialog open={dialogOpen} onOpenChange={setDialogOpen} preset={editPreset} />

      <AlertDialog open={!!deletePreset} onOpenChange={open => !open && setDeletePreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset "{deletePreset?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
