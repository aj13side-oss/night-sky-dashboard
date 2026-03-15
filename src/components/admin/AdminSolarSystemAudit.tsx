import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSolarSystemObjects, type SolarSystemObject } from "@/hooks/useSolarSystemObjects";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Star, AlertTriangle } from "lucide-react";
import SolarSystemEditDialog from "./SolarSystemEditDialog";

function DifficultyStars({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < level ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

export default function AdminSolarSystemAudit() {
  const { data: objects = [], isLoading } = useSolarSystemObjects();
  const [editItem, setEditItem] = useState<SolarSystemObject | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [imgStatus, setImgStatus] = useState<Record<string, "ok" | "broken" | "loading">>({});
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleReplaceImage = async (id: string) => {
    if (!newUrl.trim()) return;
    const { error } = await (supabase as any)
      .from("solar_system_objects")
      .update({ image_url: newUrl.trim() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["solar-system-objects"] });
      toast({ title: "Image updated" });
    }
    setReplacingId(null);
    setNewUrl("");
  };

  const checkImage = (url: string, id: string) => {
    setImgStatus(prev => ({ ...prev, [id]: "loading" }));
    const img = new Image();
    img.onload = () => setImgStatus(prev => ({ ...prev, [id]: "ok" }));
    img.onerror = () => setImgStatus(prev => ({ ...prev, [id]: "broken" }));
    img.src = url;
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">{objects.length} solar system objects</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {objects.map(obj => {
          const status = imgStatus[obj.id];
          const borderColor = status === "ok" ? "border-green-500/60" : status === "broken" ? "border-destructive/60" : "border-border/50";
          const aliases = obj.search_aliases?.split(",").map(a => a.trim()).filter(Boolean).slice(0, 10) ?? [];

          return (
            <Card key={obj.id} className={`${borderColor} overflow-hidden`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  {obj.image_url ? (
                    <div>
                      <img
                        src={obj.image_url}
                        alt={obj.name}
                        className="w-24 h-24 object-cover rounded-lg shrink-0 bg-black"
                        onLoad={() => { if (!status) checkImage(obj.image_url!, obj.id); }}
                        onError={() => setImgStatus(prev => ({ ...prev, [obj.id]: "broken" }))}
                      />
                      {obj.image_credit && (
                        <p className="text-[9px] text-muted-foreground mt-1">📷 {obj.image_credit} · {obj.image_license}</p>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-xs">No image</span>
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate">{obj.name}</h3>
                      {obj.color_hex && (
                        <div className="w-3 h-3 rounded-full shrink-0 border border-border" style={{ backgroundColor: obj.color_hex }} />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{obj.type} · Difficulty: {obj.difficulty ?? "?"}</p>
                    <DifficultyStars level={obj.difficulty} />
                    {obj.min_apparent_size_arcsec != null && obj.max_apparent_size_arcsec != null && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Size: {obj.min_apparent_size_arcsec}" – {obj.max_apparent_size_arcsec}"
                      </p>
                    )}
                  </div>
                </div>

                {obj.danger_warning && (
                  <div className="flex items-center gap-1.5 text-destructive text-[10px] bg-destructive/10 rounded px-2 py-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {obj.danger_warning}
                  </div>
                )}

                {aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aliases.map(a => (
                      <Badge key={a} variant="secondary" className="text-[8px] px-1.5 py-0">{a}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setEditItem(obj)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                    if (replacingId === obj.id) { setReplacingId(null); }
                    else { setReplacingId(obj.id); setNewUrl(obj.image_url ?? ""); }
                  }}>
                    Replace Image
                  </Button>
                </div>

                {replacingId === obj.id && (
                  <div className="flex gap-2">
                    <Input
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      placeholder="New image URL..."
                      className="text-xs bg-secondary/50 font-mono"
                    />
                    <Button size="sm" onClick={() => handleReplaceImage(obj.id)}>Save</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SolarSystemEditDialog open={!!editItem} onOpenChange={o => { if (!o) setEditItem(null); }} item={editItem} />
    </div>
  );
}
