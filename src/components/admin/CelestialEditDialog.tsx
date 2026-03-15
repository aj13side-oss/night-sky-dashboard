import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const OBJ_TYPES = [
  "Galaxy", "Emission Nebula", "Planetary Nebula", "Open Cluster", "Globular Cluster",
  "Dark Nebula", "Reflection Nebula", "Supernova Remnant", "Cluster + Nebula",
  "Star", "Double Star", "Variable Star", "Star System", "Galaxy Cluster",
  "HII Region", "Molecular Cloud", "Wolf-Rayet Nebula",
];

const FILTER_OPTIONS = [
  "Broadband RGB", "H-alpha", "H-alpha / OIII", "OIII", "SII", "Dual-band", "L-Pro", "UV/IR Cut",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Year-round"];

const CONSTELLATIONS = [
  "Andromeda", "Antlia", "Apus", "Aquarius", "Aquila", "Ara", "Aries", "Auriga",
  "Boötes", "Caelum", "Camelopardalis", "Cancer", "Canes Venatici", "Canis Major",
  "Canis Minor", "Capricornus", "Carina", "Cassiopeia", "Centaurus", "Cepheus",
  "Cetus", "Chamaeleon", "Circinus", "Columba", "Coma Berenices", "Corona Australis",
  "Corona Borealis", "Corvus", "Crater", "Crux", "Cygnus", "Delphinus", "Dorado",
  "Draco", "Equuleus", "Eridanus", "Fornax", "Gemini", "Grus", "Hercules",
  "Horologium", "Hydra", "Hydrus", "Indus", "Lacerta", "Leo", "Leo Minor",
  "Lepus", "Libra", "Lupus", "Lynx", "Lyra", "Mensa", "Microscopium",
  "Monoceros", "Musca", "Norma", "Octans", "Ophiuchus", "Orion", "Pavo",
  "Pegasus", "Perseus", "Phoenix", "Pictor", "Pisces", "Piscis Austrinus",
  "Puppis", "Pyxis", "Reticulum", "Sagitta", "Sagittarius", "Scorpius",
  "Sculptor", "Scutum", "Serpens", "Sextans", "Taurus", "Telescopium",
  "Triangulum", "Triangulum Australe", "Tucana", "Ursa Major", "Ursa Minor",
  "Vela", "Virgo", "Volans", "Vulpecula",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any | null;
}

export default function CelestialEditDialog({ open, onOpenChange, item }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [raFormat, setRaFormat] = useState<"degrees" | "hours">("degrees");
  const isNew = !item;

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({ ...item });
        setSelectedMonths(item.best_months ? item.best_months.split(",").map((m: string) => m.trim()) : []);
      } else {
        setForm({});
        setSelectedMonths([]);
      }
    }
  }, [open, item]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleMonth = (m: string) => {
    if (m === "Year-round") {
      setSelectedMonths(prev => prev.includes("Year-round") ? [] : ["Year-round"]);
      return;
    }
    setSelectedMonths(prev => {
      const next = prev.filter(x => x !== "Year-round");
      return next.includes(m) ? next.filter(x => x !== m) : [...next, m];
    });
  };

  const handleSave = async () => {
    if (!form.catalog_id?.trim()) {
      toast.error("Catalog ID is required");
      return;
    }
    setSaving(true);

    const payload: Record<string, any> = {
      catalog_id: form.catalog_id,
      common_name: form.common_name || null,
      obj_type: form.obj_type || null,
      constellation: form.constellation || null,
      scientific_notation: form.scientific_notation || null,
      search_aliases: form.search_aliases || null,
      ra: form.ra != null ? Number(form.ra) : null,
      dec: form.dec != null ? Number(form.dec) : null,
      size_max: form.size_max != null ? Number(form.size_max) : null,
      magnitude: form.magnitude != null ? Number(form.magnitude) : null,
      surf_brightness: form.surf_brightness != null ? Number(form.surf_brightness) : null,
      photo_score: form.photo_score != null ? Number(form.photo_score) : null,
      exposure_guide_fast: form.exposure_guide_fast != null ? Number(form.exposure_guide_fast) : null,
      exposure_guide_deep: form.exposure_guide_deep != null ? Number(form.exposure_guide_deep) : null,
      recommended_filter: form.recommended_filter || null,
      moon_tolerance: form.moon_tolerance != null ? Number(form.moon_tolerance) : null,
      best_months: selectedMonths.length > 0 ? selectedMonths.join(", ") : null,
      ideal_resolution: form.ideal_resolution || null,
      forced_image_url: form.forced_image_url || null,
      image_search_query: form.image_search_query || null,
      parent_id: form.parent_id || null,
      relation_note: form.relation_note || null,
      alias_details: form.alias_details || null,
    };

    try {
      if (isNew) {
        const { error } = await (supabase as any).from("celestial_objects").insert(payload);
        if (error) throw error;
        toast.success("Object created!");
      } else {
        const { error } = await (supabase as any).from("celestial_objects").update(payload).eq("id", item.id);
        if (error) throw error;
        toast.success("Object updated!");
      }
      qc.invalidateQueries({ queryKey: ["admin_celestial"] });
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
          <DialogTitle>{isNew ? "New Celestial Object" : `Edit ${form.catalog_id || ""}`}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6">
          <div className="space-y-6 py-4">
            {/* Section 1: Identity */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Identity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Catalog ID {isNew && "*"}</Label>
                  <Input value={form.catalog_id || ""} onChange={e => set("catalog_id", e.target.value)} className="mt-1" readOnly={!isNew} />
                </div>
                <div>
                  <Label className="text-xs">Common Name</Label>
                  <Input value={form.common_name || ""} onChange={e => set("common_name", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Object Type</Label>
                  <Select value={form.obj_type || ""} onValueChange={v => set("obj_type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {OBJ_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Constellation</Label>
                  <Select value={form.constellation || ""} onValueChange={v => set("constellation", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select constellation" /></SelectTrigger>
                    <SelectContent>
                      {CONSTELLATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Scientific Notation</Label>
                  <Input value={form.scientific_notation || ""} onChange={e => set("scientific_notation", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Search Aliases</Label>
                  <Input value={form.search_aliases || ""} onChange={e => set("search_aliases", e.target.value)} className="mt-1" />
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 2: Coordinates & Size */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Coordinates & Size</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">RA (degrees)</Label>
                  <Input type="number" step="any" value={form.ra ?? ""} onChange={e => set("ra", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Dec (degrees)</Label>
                  <Input type="number" step="any" value={form.dec ?? ""} onChange={e => set("dec", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Size Max (arcmin)</Label>
                  <Input type="number" step="any" value={form.size_max ?? ""} onChange={e => set("size_max", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Magnitude</Label>
                  <Input type="number" step="any" value={form.magnitude ?? ""} onChange={e => set("magnitude", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Surface Brightness</Label>
                  <Input type="number" step="any" value={form.surf_brightness ?? ""} onChange={e => set("surf_brightness", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 3: Imaging Guide */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Imaging Guide</h3>
              <div>
                <Label className="text-xs">Photo Score: {form.photo_score ?? 0}</Label>
                <Slider value={[form.photo_score ?? 0]} min={0} max={100} step={1} onValueChange={v => set("photo_score", v[0])} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Exposure Guide Fast (s)</Label>
                  <Input type="number" step="any" value={form.exposure_guide_fast ?? ""} onChange={e => set("exposure_guide_fast", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Exposure Guide Deep (s)</Label>
                  <Input type="number" step="any" value={form.exposure_guide_deep ?? ""} onChange={e => set("exposure_guide_deep", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Recommended Filter</Label>
                  <Select value={form.recommended_filter || ""} onValueChange={v => set("recommended_filter", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select filter" /></SelectTrigger>
                    <SelectContent>
                      {FILTER_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Moon Tolerance: {form.moon_tolerance ?? 0}</Label>
                  <Slider value={[form.moon_tolerance ?? 0]} min={0} max={100} step={1} onValueChange={v => set("moon_tolerance", v[0])} className="mt-2" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Best Months</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {MONTHS.map(m => (
                    <button key={m} onClick={() => toggleMonth(m)}
                      className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${selectedMonths.includes(m) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Ideal Resolution</Label>
                <Input value={form.ideal_resolution || ""} onChange={e => set("ideal_resolution", e.target.value)} className="mt-1" />
              </div>
            </section>

            <Separator />

            {/* Section 4: Image */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Image</h3>
              <div>
                <Label className="text-xs">Forced Image URL</Label>
                <Input value={form.forced_image_url || ""} onChange={e => set("forced_image_url", e.target.value)} className="mt-1" />
                {form.forced_image_url && (
                  <img src={form.forced_image_url} alt="preview" className="mt-2 h-24 rounded object-contain bg-secondary/20" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Image Search Query</Label>
                  <Input value={form.image_search_query || ""} onChange={e => set("image_search_query", e.target.value)} className="mt-1" />
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const q = form.image_search_query || `${form.catalog_id} ${form.common_name || ""} astronomy astrophotography`;
                  window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`, "_blank");
                }}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Google Images
                </Button>
              </div>
            </section>

            <Separator />

            {/* Section 5: Relations */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Relations</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Parent ID</Label>
                  <Input value={form.parent_id || ""} onChange={e => set("parent_id", e.target.value || null)} className="mt-1" placeholder="UUID of parent object" />
                </div>
                <div>
                  <Label className="text-xs">Relation Note</Label>
                  <Input value={form.relation_note || ""} onChange={e => set("relation_note", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Alias Details (JSON)</Label>
                <Textarea
                  value={form.alias_details ? (typeof form.alias_details === "string" ? form.alias_details : JSON.stringify(form.alias_details, null, 2)) : ""}
                  onChange={e => {
                    try { set("alias_details", JSON.parse(e.target.value)); } catch { set("alias_details", e.target.value); }
                  }}
                  className="mt-1 font-mono text-xs"
                  rows={3}
                />
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
