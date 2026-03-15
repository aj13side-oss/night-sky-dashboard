import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCameras, useTelescopes, useMounts, useFilters, extractPrices } from "@/hooks/useEquipmentCatalog";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const RETAILERS = [
  { key: "amazon", label: "Amazon" },
  { key: "pierro_astro", label: "Pierro" },
  { key: "optique_unterlinden", label: "Unterlinden" },
  { key: "agena", label: "Agena" },
  { key: "high_point_scientific", label: "HPS" },
  { key: "astronome_fr", label: "Astronome" },
  { key: "astroshop_de", label: "Astroshop" },
  { key: "univers_astro", label: "Univers" },
];

const TABLE_MAP: Record<string, string> = {
  "Caméra": "astro_cameras", "Télescope": "astro_telescopes", "Monture": "astro_mounts", "Filtre": "astro_filters",
};

type PriceRow = { id: string; brand: string; model: string; category: string; table: string; raw: Record<string, any> };

export default function AdminPrices() {
  const qc = useQueryClient();
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // "id|key"
  const [editValue, setEditValue] = useState("");
  const [flashCell, setFlashCell] = useState<string | null>(null);

  const allRows: PriceRow[] = useMemo(() => {
    const rows: PriceRow[] = [];
    cameras?.forEach(c => rows.push({ id: c.id, brand: c.brand, model: c.model, category: "Caméra", table: "astro_cameras", raw: c._raw ?? {} }));
    telescopes?.forEach(t => rows.push({ id: t.id, brand: t.brand, model: t.model, category: "Télescope", table: "astro_telescopes", raw: t._raw ?? {} }));
    mounts?.forEach(m => rows.push({ id: m.id, brand: m.brand, model: m.model, category: "Monture", table: "astro_mounts", raw: m._raw ?? {} }));
    filters?.forEach(f => rows.push({ id: f.id, brand: f.brand, model: f.model, category: "Filtre", table: "astro_filters", raw: f._raw ?? {} }));
    return rows;
  }, [cameras, telescopes, mounts, filters]);

  const filtered = useMemo(() => {
    let list = allRows;
    if (catFilter) list = list.filter(r => r.category === catFilter);
    if (priceFilter === "with") list = list.filter(r => extractPrices(r.raw).best !== null);
    if (priceFilter === "without") list = list.filter(r => extractPrices(r.raw).best === null);
    return list;
  }, [allRows, catFilter, priceFilter]);

  const totalPrices = allRows.reduce((sum, r) => {
    return sum + RETAILERS.filter(ret => r.raw[`price_${ret.key}`] != null && r.raw[`price_${ret.key}`] > 0).length;
  }, 0);
  const withAtLeastOne = allRows.filter(r => extractPrices(r.raw).best !== null).length;

  const handleSavePrice = async (row: PriceRow, retailerKey: string) => {
    const val = editValue.trim() === "" ? null : Number(editValue);
    const cellKey = `${row.id}|${retailerKey}`;
    const { error } = await (supabase as any).from(row.table).update({ [`price_${retailerKey}`]: val }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      setFlashCell(`${cellKey}:error`);
      setTimeout(() => setFlashCell(null), 600);
      return;
    }
    toast.success("Price updated");
    setEditing(null);
    setEditValue("");
    setFlashCell(`${cellKey}:ok`);
    setTimeout(() => setFlashCell(null), 600);
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{totalPrices}</p>
          <p className="text-[10px] text-muted-foreground">prices retrieved</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{withAtLeastOne}</p>
          <p className="text-[10px] text-muted-foreground">products with ≥1 price</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{allRows.length}</p>
          <p className="text-[10px] text-muted-foreground">total products</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-4">
        <ChipFilter label="Category" options={["Caméra", "Télescope", "Monture", "Filtre"]} selected={catFilter} onChange={setCatFilter} />
        <ChipFilter label="Price" options={["with", "without"]} selected={priceFilter} onChange={setPriceFilter} />
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-24">Brand</TableHead>
                <TableHead className="text-[10px] w-40">Model</TableHead>
                <TableHead className="text-[10px] w-16">Cat.</TableHead>
                {RETAILERS.map(r => <TableHead key={r.key} className="text-[10px] text-center w-16">{r.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(row => (
                <TableRow key={row.id}>
                  <TableCell className="text-[10px] font-mono">{row.brand}</TableCell>
                  <TableCell className="text-[10px] font-mono truncate max-w-[160px]">{row.model}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[8px]">{row.category}</Badge></TableCell>
                  {RETAILERS.map(r => {
                    const price = row.raw[`price_${r.key}`];
                    const cellKey = `${row.id}|${r.key}`;
                    const isEditing = editing === cellKey;
                    const flash = flashCell?.startsWith(cellKey) ? flashCell.split(":")[1] : null;

                    if (isEditing) {
                      return (
                        <TableCell key={r.key} className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSavePrice(row, r.key); if (e.key === "Escape") setEditing(null); }}
                            onBlur={() => handleSavePrice(row, r.key)}
                            className="h-5 text-[9px] px-1 w-16"
                            autoFocus
                          />
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={r.key}
                        className={`text-center text-[10px] font-mono cursor-pointer transition-colors ${
                          flash === "ok" ? "bg-green-500/20" : flash === "error" ? "bg-red-500/20" :
                          price ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground/30 hover:bg-muted/20"
                        }`}
                        onClick={() => { setEditing(cellKey); setEditValue(price ? String(price) : ""); }}
                      >
                        {price ? `${Number(price).toLocaleString("en-US")}€` : "+"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && <p className="text-[10px] text-muted-foreground p-2 text-center">Showing 100 of {filtered.length}</p>}
      </Card>
    </div>
  );
}
