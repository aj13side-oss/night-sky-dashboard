import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { HardDrive, ChevronDown, Trash2, Upload, Star } from "lucide-react";
import { useUserRigs, useDeleteRig, useCurrentUser } from "@/hooks/useUserRigs";
import { toast } from "sonner";

interface UserRigsPanelProps {
  onLoad: (rig: { telescope_id: string | null; camera_id: string | null; mount_id: string | null; filter_ids: string[] | null; accessory_ids: string[] | null }) => void;
}

export function UserRigsPanel({ onLoad }: UserRigsPanelProps) {
  const { userId } = useCurrentUser();
  const { data: rigs, isLoading } = useUserRigs();
  const deleteRig = useDeleteRig();
  const [open, setOpen] = useState(false);

  if (!userId || !rigs || rigs.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-2">
          <HardDrive className="w-4 h-4 text-primary" />
          Mes Setups
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{rigs.length}</Badge>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {rigs.map(rig => {
            const cached = rig.cached_calculations as Record<string, any> | null;
            return (
              <div
                key={rig.id}
                className="flex-shrink-0 w-[240px] rounded-lg border border-border/50 p-3 flex flex-col gap-2 bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-sm text-foreground truncate">{rig.name}</span>
                  {rig.is_current && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5 shrink-0">
                      <Star className="w-2.5 h-2.5" /> Principal
                    </Badge>
                  )}
                </div>

                {cached && (
                  <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                    {cached.sampling && <span>{cached.sampling}″/px</span>}
                    {cached.fov && <span>{cached.fov}</span>}
                    {cached.score != null && <span>{cached.score}/100</span>}
                  </div>
                )}

                {rig.notes && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{rig.notes}</p>
                )}

                <div className="flex gap-1.5 mt-auto">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-primary/30 hover:bg-primary/10 gap-1"
                    onClick={() => {
                      onLoad({
                        telescope_id: rig.telescope_id,
                        camera_id: rig.camera_id,
                        mount_id: rig.mount_id,
                        filter_ids: rig.filter_ids,
                        accessory_ids: rig.accessory_ids,
                      });
                      toast.success(`Setup "${rig.name}" chargé`);
                    }}>
                    <Upload className="w-3 h-3" /> Charger
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce setup ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Le setup "{rig.name}" sera supprimé définitivement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          deleteRig.mutate(rig.id, {
                            onSuccess: () => toast.success("Setup supprimé"),
                            onError: (e) => toast.error(`Erreur: ${e.message}`),
                          });
                        }}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
