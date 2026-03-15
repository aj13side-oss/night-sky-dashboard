import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const RETAILERS = ["amazon", "pierro_astro", "optique_unterlinden", "agena", "high_point_scientific", "astronome_fr", "astroshop_de", "univers_astro"];
const RETAILER_LABELS: Record<string, string> = {
  amazon: "Amazon", pierro_astro: "Pierro Astro", optique_unterlinden: "Optique Unterlinden",
  agena: "Agena Astro", high_point_scientific: "High Point Scientific", astronome_fr: "Astronome.fr",
  astroshop_de: "Astroshop", univers_astro: "Univers Astro",
};

type Category = "cameras" | "telescopes" | "mounts" | "filters" | "accessories";

const TABLE_MAP: Record<Category, string> = {
  cameras: "astro_cameras", telescopes: "astro_telescopes", mounts: "astro_mounts",
  filters: "astro_filters", accessories: "astro_accessories",
};

const SPEC_FIELDS: Record<Category, { key: string; label: string; type: "text" | "number" | "boolean" }[]> = {
  cameras: [
    { key: "sensor_name", label: "Sensor Name", type: "text" },
    { key: "pixel_size_um", label: "Pixel Size (µm)", type: "number" },
    { key: "sensor_width_mm", label: "Sensor Width (mm)", type: "number" },
    { key: "sensor_height_mm", label: "Sensor Height (mm)", type: "number" },
    { key: "resolution_x", label: "Resolution X", type: "number" },
    { key: "resolution_y", label: "Resolution Y", type: "number" },
    { key: "resolution_mp", label: "Resolution (MP)", type: "number" },
    { key: "is_color", label: "Color Sensor", type: "boolean" },
    { key: "qe_percent", label: "QE (%)", type: "number" },
    { key: "read_noise_e", label: "Read Noise (e⁻)", type: "number" },
    { key: "full_well_e", label: "Full Well (e⁻)", type: "number" },
    { key: "adc_bits", label: "ADC Bits", type: "number" },
    { key: "cooling_delta_c", label: "Cooling Delta (°C)", type: "number" },
    { key: "internal_backfocus_mm", label: "Backfocus (mm)", type: "number" },
    { key: "weight_g", label: "Weight (g)", type: "number" },
    { key: "interface_usb", label: "Interface USB", type: "text" },
  ],
  telescopes: [
    { key: "type", label: "Type", type: "text" },
    { key: "focal_length_mm", label: "Focal Length (mm)", type: "number" },
    { key: "aperture_mm", label: "Aperture (mm)", type: "number" },
    { key: "f_ratio", label: "F-Ratio", type: "number" },
    { key: "image_circle_mm", label: "Image Circle (mm)", type: "number" },
    { key: "weight_kg", label: "Weight (kg)", type: "number" },
    { key: "required_backfocus_mm", label: "Required Backfocus (mm)", type: "number" },
    { key: "output_thread", label: "Output Thread", type: "text" },
    { key: "dovetail_type", label: "Dovetail Type", type: "text" },
    { key: "focuser_size_inch", label: "Focuser Size (inch)", type: "number" },
  ],
  mounts: [
    { key: "mount_type", label: "Mount Type", type: "text" },
    { key: "payload_kg", label: "Payload (kg)", type: "number" },
    { key: "mount_weight_kg", label: "Mount Weight (kg)", type: "number" },
    { key: "periodic_error_arcsec", label: "Periodic Error (arcsec)", type: "number" },
    { key: "is_goto", label: "GoTo", type: "boolean" },
    { key: "connectivity", label: "Connectivity", type: "text" },
    { key: "power_required", label: "Power Required", type: "text" },
    { key: "ascom_indi", label: "ASCOM/INDI", type: "boolean" },
  ],
  filters: [
    { key: "type", label: "Type", type: "text" },
    { key: "size", label: "Size", type: "text" },
    { key: "bandwidth_nm", label: "Bandwidth (nm)", type: "number" },
    { key: "transmission_percent", label: "Transmission (%)", type: "number" },
    { key: "thickness_mm", label: "Thickness (mm)", type: "number" },
    { key: "target_sensor", label: "Target Sensor", type: "text" },
  ],
  accessories: [
    { key: "category", label: "Category", type: "text" },
    { key: "optical_length_mm", label: "Optical Length (mm)", type: "number" },
    { key: "magnification_factor", label: "Magnification Factor", type: "number" },
    { key: "weight_g", label: "Weight (g)", type: "number" },
    { key: "input_connection", label: "Input Connection", type: "text" },
    { key: "output_connection", label: "Output Connection", type: "text" },
    { key: "focal_length_mm", label: "Focal Length (mm)", type: "number" },
    { key: "aperture_mm", label: "Aperture (mm)", type: "number" },
    { key: "required_backfocus_mm", label: "Required Backfocus (mm)", type: "number" },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  item?: Record<string, any> | null;
}

export default function EquipmentEditDialog({ open, onOpenChange, category, item }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const isNew = !item;
  const table = TABLE_MAP[category];

  useEffect(() => {
    if (open) {
      setForm(item?._raw ? { ...item._raw } : { brand: "", model: "" });
    }
  }, [open, item]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.brand?.trim() || !form.model?.trim()) {
      toast.error("Brand and Model are required");
      return;
    }
    setSaving(true);
    // Remove internal fields
    const payload = { ...form };
    delete payload._raw;
    delete payload.weight_kg; // cameras compute this

    try {
      if (isNew) {
        if (category !== "accessories") {
          // String IDs: generate a slug
          payload.id = payload.id || `${form.brand.toLowerCase().replace(/\s+/g, "_")}_${form.model.toLowerCase().replace(/\s+/g, "_")}`;
        }
        const { error } = await (supabase as any).from(table).insert(payload);
        if (error) throw error;
        toast.success("Item created!");
      } else {
        const id = item!.id ?? item!._raw?.id;
        const { error } = await (supabase as any).from(table).update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Item updated!");
      }
      qc.invalidateQueries({ queryKey: [table] });
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
          <DialogTitle>{isNew ? "Add New" : "Edit"} — {category}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6">
          <div className="space-y-6 py-4">
            {/* Identity */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Identity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Brand *</Label>
                  <Input value={form.brand || ""} onChange={e => set("brand", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Model *</Label>
                  <Input value={form.model || ""} onChange={e => set("model", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input value={form.image_url || ""} onChange={e => set("image_url", e.target.value)} className="mt-1" />
                {form.image_url && (
                  <img src={form.image_url} alt="preview" className="mt-2 h-20 rounded object-contain bg-secondary/20" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>
            </section>

            <Separator />

            {/* Specs */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Specifications</h3>
              <div className="grid grid-cols-2 gap-3">
                {SPEC_FIELDS[category].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    {f.type === "boolean" ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Switch checked={!!form[f.key]} onCheckedChange={v => set(f.key, v)} />
                        <span className="text-xs text-muted-foreground">{form[f.key] ? "Yes" : "No"}</span>
                      </div>
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : "text"}
                        value={form[f.key] ?? ""}
                        onChange={e => set(f.key, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                        className="mt-1"
                        step={f.type === "number" ? "any" : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* URLs */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Retailer URLs</h3>
              <div>
                <Label className="text-xs">Manufacturer URL</Label>
                <Input value={form.url_manufacturer || ""} onChange={e => set("url_manufacturer", e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {RETAILERS.map(r => (
                  <div key={r}>
                    <Label className="text-xs">{RETAILER_LABELS[r]}</Label>
                    <Input value={form[`url_${r}`] || ""} onChange={e => set(`url_${r}`, e.target.value)} className="mt-1" />
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Prices */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Prices</h3>
              <div className="grid grid-cols-2 gap-3">
                {RETAILERS.map(r => (
                  <div key={r}>
                    <Label className="text-xs">{RETAILER_LABELS[r]} (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form[`price_${r}`] ?? ""}
                      onChange={e => set(`price_${r}`, e.target.value === "" ? null : Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                ))}
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
