import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useSaveRig, useCurrentUser } from "@/hooks/useUserRigs";
import { toast } from "sonner";

interface SaveRigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telescopeId: string | null;
  cameraId: string | null;
  mountId: string | null;
  filterIds: string[] | null;
  accessoryIds: string[] | null;
  cachedCalculations?: Record<string, any>;
}

export function SaveRigDialog({
  open, onOpenChange,
  telescopeId, cameraId, mountId, filterIds, accessoryIds,
  cachedCalculations,
}: SaveRigDialogProps) {
  const [name, setName] = useState("Mon Setup");
  const [notes, setNotes] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const { userId } = useCurrentUser();
  const saveRig = useSaveRig();

  const handleSave = () => {
    if (!userId) {
      toast.error("Connectez-vous pour sauvegarder un setup");
      return;
    }
    saveRig.mutate({
      name,
      notes: notes || undefined,
      is_current: isCurrent,
      telescope_id: telescopeId,
      camera_id: cameraId,
      mount_id: mountId,
      filter_ids: filterIds,
      accessory_ids: accessoryIds,
      cached_calculations: cachedCalculations,
    }, {
      onSuccess: () => {
        toast.success("Setup sauvegardé !");
        onOpenChange(false);
        setName("Mon Setup");
        setNotes("");
        setIsCurrent(false);
      },
      onError: (e) => toast.error(`Erreur: ${e.message}`),
    });
  };

  if (!userId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sauvegarder le setup</DialogTitle>
            <DialogDescription>
              Connectez-vous pour sauvegarder vos configurations d'équipement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-4 h-4" /> Sauvegarder le setup
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="rig-name">Nom du setup</Label>
            <Input id="rig-name" value={name} onChange={e => setName(e.target.value)} placeholder="Mon setup deep sky" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rig-notes">Notes (optionnel)</Label>
            <Textarea id="rig-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes sur ce setup..." rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="rig-current" checked={isCurrent} onCheckedChange={c => setIsCurrent(!!c)} />
            <Label htmlFor="rig-current" className="text-sm">Définir comme setup principal</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saveRig.isPending}>
            {saveRig.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
