import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories } from "@/hooks/useEquipmentCatalog";
import EquipmentEditDialog from "./EquipmentEditDialog";

type Category = "cameras" | "telescopes" | "mounts" | "filters" | "accessories";

const CATEGORIES: { key: Category; label: string; table: string }[] = [
  { key: "cameras", label: "Cameras", table: "astro_cameras" },
  { key: "telescopes", label: "Telescopes", table: "astro_telescopes" },
  { key: "mounts", label: "Mounts", table: "astro_mounts" },
  { key: "filters", label: "Filters", table: "astro_filters" },
  { key: "accessories", label: "Accessories", table: "astro_accessories" },
];

const SPEC_COLUMNS: Record<Category, { key: string; label: string }[]> = {
  cameras: [
    { key: "sensor_name", label: "Sensor" },
    { key: "pixel_size_um", label: "Pixel (µm)" },
    { key: "_sensor_size", label: "Sensor Size" },
    { key: "is_color", label: "Color" },
    { key: "qe_percent", label: "QE%" },
    { key: "read_noise_e", label: "Noise" },
    { key: "cooling_delta_c", label: "Cooling" },
  ],
  telescopes: [
    { key: "type", label: "Type" },
    { key: "focal_length_mm", label: "FL (mm)" },
    { key: "aperture_mm", label: "Aper (mm)" },
    { key: "f_ratio", label: "f/" },
    { key: "image_circle_mm", label: "IC (mm)" },
    { key: "weight_kg", label: "Weight" },
  ],
  mounts: [
    { key: "mount_type", label: "Type" },
    { key: "payload_kg", label: "Payload" },
    { key: "mount_weight_kg", label: "Weight" },
    { key: "periodic_error_arcsec", label: "PE\"" },
    { key: "is_goto", label: "GoTo" },
    { key: "connectivity", label: "Connect" },
  ],
  filters: [
    { key: "type", label: "Type" },
    { key: "size", label: "Size" },
    { key: "bandwidth_nm", label: "BW (nm)" },
    { key: "transmission_percent", label: "Trans%" },
    { key: "thickness_mm", label: "Thick" },
  ],
  accessories: [
    { key: "category", label: "Category" },
    { key: "optical_length_mm", label: "OL (mm)" },
    { key: "magnification_factor", label: "Mag" },
    { key: "weight_g", label: "Weight" },
    { key: "input_connection", label: "In" },
    { key: "output_connection", label: "Out" },
  ],
};

export default function AdminEquipmentCRUD() {
  const qc = useQueryClient();
  const [cat, setCat] = useState<Category>("cameras");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ id: string; brand: string; model: string } | null>(null);

  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const { data: accessories } = useAccessories();

  const dataMap: Record<Category, any[] | undefined> = { cameras, telescopes, mounts, filters, accessories };
  const items = dataMap[cat] ?? [];
  const catInfo = CATEGORIES.find(c => c.key === cat)!;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i: any) => `${i.brand} ${i.model}`.toLowerCase().includes(q));
  }, [items, search]);

  const getCellValue = (item: any, key: string) => {
    if (key === "_sensor_size") {
      const w = item.sensor_width_mm;
      const h = item.sensor_height_mm;
      return w && h ? `${w}×${h}` : "—";
    }
    if (key === "is_color" || key === "is_goto") return item[key] ? "✓" : item[key] === false ? "✗" : "—";
    const v = item[key] ?? item._raw?.[key];
    if (v == null) return "—";
    if (typeof v === "number") return v.toLocaleString("en-US");
    return String(v);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const { error } = await (supabase as any).from(catInfo.table).delete().eq("id", deleteItem.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${deleteItem.brand} ${deleteItem.model} deleted`);
    qc.invalidateQueries({ queryKey: [catInfo.table] });
    setDeleteItem(null);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => { setCat(c.key); setSearch(""); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${cat === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search brand or model..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/30 border-border/50" />
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add New
        </Button>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-10">Img</TableHead>
                <TableHead className="text-[10px] w-24">Brand</TableHead>
                <TableHead className="text-[10px] w-40">Model</TableHead>
                {SPEC_COLUMNS[cat].map(c => (
                  <TableHead key={c.key} className="text-[10px] text-center">{c.label}</TableHead>
                ))}
                <TableHead className="text-[10px] w-16 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="p-1">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-10 h-10 rounded object-contain bg-secondary/20" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center text-[8px] text-muted-foreground">—</div>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] font-mono">{item.brand}</TableCell>
                  <TableCell className="text-[10px] font-mono truncate max-w-[160px]">{item.model}</TableCell>
                  {SPEC_COLUMNS[cat].map(c => (
                    <TableCell key={c.key} className="text-[10px] text-center font-mono">{getCellValue(item, c.key)}</TableCell>
                  ))}
                  <TableCell className="p-1">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeleteItem({ id: item.id, brand: item.brand, model: item.model })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && <p className="text-[10px] text-muted-foreground p-2 text-center">Showing 100 of {filtered.length}</p>}
      </Card>

      <EquipmentEditDialog open={dialogOpen} onOpenChange={setDialogOpen} category={cat} item={editItem} />

      <AlertDialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteItem?.brand} {deleteItem?.model}?</AlertDialogTitle>
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
