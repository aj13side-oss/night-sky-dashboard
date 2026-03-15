import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCameras, useTelescopes, useMounts } from "@/hooks/useEquipmentCatalog";

const USE_CASES = [
  { value: "beginner_deepsky", label: "Beginner Deep Sky" },
  { value: "intermediate_deepsky", label: "Intermediate Deep Sky" },
  { value: "advanced_deepsky", label: "Advanced Deep Sky" },
  { value: "widefield", label: "Widefield" },
  { value: "narrowband", label: "Narrowband" },
  { value: "beginner_planetary", label: "Beginner Planetary" },
  { value: "budget", label: "Budget" },
  { value: "portable", label: "Portable" },
  { value: "premium", label: "Premium" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: any | null;
}

export default function PresetEditDialog({ open, onOpenChange, preset }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const isNew = !preset;

  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();

  useEffect(() => {
    if (open) {
      setForm(preset ? { ...preset } : { name: "", slug: "", use_case: "beginner_deepsky", description_fr: "", difficulty_level: 1, is_featured: false, sort_order: 0 });
    }
  }, [open, preset]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name?.trim() || !form.use_case) {
      toast.error("Name and Use Case are required");
      return;
    }
    setSaving(true);
    const payload: Record<string, any> = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
      use_case: form.use_case,
      description_fr: form.description_fr || "",
      description_en: form.description_en || null,
      camera_id: form.camera_id || null,
      telescope_id: form.telescope_id || null,
      mount_id: form.mount_id || null,
      difficulty_level: form.difficulty_level ?? 1,
      budget_min_eur: form.budget_min_eur != null ? Number(form.budget_min_eur) : null,
      budget_max_eur: form.budget_max_eur != null ? Number(form.budget_max_eur) : null,
      is_featured: !!form.is_featured,
      sort_order: form.sort_order ?? 0,
    };

    try {
      if (isNew) {
        const { error } = await (supabase as any).from("rig_presets").insert(payload);
        if (error) throw error;
        toast.success("Preset created!");
      } else {
        const { error } = await (supabase as any).from("rig_presets").update(payload).eq("id", preset.id);
        if (error) throw error;
        toast.success("Preset updated!");
      }
      qc.invalidateQueries({ queryKey: ["rig_presets"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{isNew ? "New Preset" : `Edit ${form.name || ""}`}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6">
          <div className="space-y-6 py-4">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">General</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input value={form.name || ""} onChange={e => set("name", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Slug</Label>
                  <Input value={form.slug || ""} onChange={e => set("slug", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Use Case *</Label>
                <Select value={form.use_case || ""} onValueChange={v => set("use_case", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USE_CASES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description (FR)</Label>
                <Textarea value={form.description_fr || ""} onChange={e => set("description_fr", e.target.value)} className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-xs">Description (EN)</Label>
                <Textarea value={form.description_en || ""} onChange={e => set("description_en", e.target.value)} className="mt-1" rows={2} />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Equipment</h3>
              <div>
                <Label className="text-xs">Camera</Label>
                <Select value={form.camera_id || "_none"} onValueChange={v => set("camera_id", v === "_none" ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select camera" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— None —</SelectItem>
                    {cameras?.map(c => <SelectItem key={c.id} value={c.id}>{c.brand} {c.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Telescope</Label>
                <Select value={form.telescope_id || "_none"} onValueChange={v => set("telescope_id", v === "_none" ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select telescope" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— None —</SelectItem>
                    {telescopes?.map(t => <SelectItem key={t.id} value={t.id}>{t.brand} {t.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mount</Label>
                <Select value={form.mount_id || "_none"} onValueChange={v => set("mount_id", v === "_none" ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select mount" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— None —</SelectItem>
                    {mounts?.map(m => <SelectItem key={m.id} value={m.id}>{m.brand} {m.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <div>
                <Label className="text-xs">Difficulty Level: {form.difficulty_level ?? 1}</Label>
                <Slider value={[form.difficulty_level ?? 1]} min={1} max={5} step={1} onValueChange={v => set("difficulty_level", v[0])} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Budget Min (€)</Label>
                  <Input type="number" value={form.budget_min_eur ?? ""} onChange={e => set("budget_min_eur", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Budget Max (€)</Label>
                  <Input type="number" value={form.budget_max_eur ?? ""} onChange={e => set("budget_max_eur", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={form.sort_order ?? 0} onChange={e => set("sort_order", Number(e.target.value))} className="mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <Switch checked={!!form.is_featured} onCheckedChange={v => set("is_featured", v)} />
                  <Label className="text-xs">Featured</Label>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : isNew ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
