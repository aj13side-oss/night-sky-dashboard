import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SolarSystemObject } from "@/hooks/useSolarSystemObjects";

const TYPES = ["Star", "Moon", "Planet", "Dwarf Planet", "Asteroid", "Satellite"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SolarSystemObject | null;
}

export default function SolarSystemEditDialog({ open, onOpenChange, item }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (item) setForm({ ...item });
  }, [item]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const { error } = await (supabase as any)
        .from("solar_system_objects")
        .update(rest)
        .eq("id", item.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["solar-system-objects"] });
      toast({ title: "Saved", description: `${form.name} updated` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit {item.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 max-h-[65vh]">
          <div className="space-y-6 pb-4">
            {/* Identity */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type ?? ""} onValueChange={v => set("type", v)}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} className="bg-secondary/50 text-xs" rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Search Aliases (comma-separated)</Label>
                <Textarea value={form.search_aliases ?? ""} onChange={e => set("search_aliases", e.target.value)} className="bg-secondary/50 text-xs" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Color Hex</Label>
                  <div className="flex items-center gap-2">
                    <Input value={form.color_hex ?? ""} onChange={e => set("color_hex", e.target.value)} className="bg-secondary/50 font-mono text-xs" />
                    {form.color_hex && <div className="w-6 h-6 rounded-full border border-border shrink-0" style={{ backgroundColor: form.color_hex }} />}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={form.sort_order ?? 0} onChange={e => set("sort_order", Number(e.target.value))} className="bg-secondary/50 font-mono" />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={form.is_active ?? true} onCheckedChange={v => set("is_active", v)} />
                </div>
              </div>
            </section>

            {/* Physical Properties */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Physical Properties</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Min Apparent Size (arcsec)</Label>
                  <Input type="number" step="0.1" value={form.min_apparent_size_arcsec ?? ""} onChange={e => set("min_apparent_size_arcsec", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Apparent Size (arcsec)</Label>
                  <Input type="number" step="0.1" value={form.max_apparent_size_arcsec ?? ""} onChange={e => set("max_apparent_size_arcsec", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Magnitude</Label>
                  <Input type="number" step="0.1" value={form.min_magnitude ?? ""} onChange={e => set("min_magnitude", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Magnitude</Label>
                  <Input type="number" step="0.1" value={form.max_magnitude ?? ""} onChange={e => set("max_magnitude", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Orbital Period (days)</Label>
                  <Input type="number" step="0.01" value={form.orbital_period_days ?? ""} onChange={e => set("orbital_period_days", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distance AU Min</Label>
                  <Input type="number" step="0.01" value={form.distance_au_min ?? ""} onChange={e => set("distance_au_min", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distance AU Max</Label>
                  <Input type="number" step="0.01" value={form.distance_au_max ?? ""} onChange={e => set("distance_au_max", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
              </div>
            </section>

            {/* Imaging Guide */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imaging Guide</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Recommended Focal (mm)</Label>
                  <Input type="number" value={form.recommended_focal_mm ?? ""} onChange={e => set("recommended_focal_mm", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Technique</Label>
                  <Input value={form.recommended_technique ?? ""} onChange={e => set("recommended_technique", e.target.value)} className="bg-secondary/50 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Filters</Label>
                  <Input value={form.recommended_filters ?? ""} onChange={e => set("recommended_filters", e.target.value)} className="bg-secondary/50 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Capture FPS</Label>
                  <Input type="number" value={form.capture_fps ?? ""} onChange={e => set("capture_fps", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Capture Duration (sec)</Label>
                  <Input type="number" value={form.capture_duration_sec ?? ""} onChange={e => set("capture_duration_sec", e.target.value ? Number(e.target.value) : null)} className="bg-secondary/50 font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capture / Gain Note</Label>
                <Textarea value={form.capture_gain_note ?? ""} onChange={e => set("capture_gain_note", e.target.value)} className="bg-secondary/50 text-xs" rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Difficulty: {form.difficulty ?? 1}/5</Label>
                <Slider min={1} max={5} step={1} value={[form.difficulty ?? 1]} onValueChange={v => set("difficulty", v[0])} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-destructive">Danger Warning</Label>
                <Textarea value={form.danger_warning ?? ""} onChange={e => set("danger_warning", e.target.value)} className="bg-secondary/50 text-xs border-destructive/30" rows={2} />
              </div>
            </section>

            {/* Image */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</h4>
              <div className="space-y-1">
                <Label className="text-xs">Image URL</Label>
                <Input value={form.image_url ?? ""} onChange={e => set("image_url", e.target.value)} className="bg-secondary/50 text-xs font-mono" />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt={form.name} className="w-40 h-40 object-cover rounded-lg border border-border" />
              )}
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
