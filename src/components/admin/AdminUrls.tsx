import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCameras, useTelescopes, useMounts, useFilters } from "@/hooks/useEquipmentCatalog";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";
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

type UrlRow = { id: string; brand: string; model: string; category: string; table: string; raw: Record<string, any> };

export default function AdminUrls() {
  const qc = useQueryClient();
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // "id|key"
  const [editUrl, setEditUrl] = useState("");

  const allRows: UrlRow[] = useMemo(() => {
    const rows: UrlRow[] = [];
    cameras?.forEach(c => rows.push({ id: c.id, brand: c.brand, model: c.model, category: "Caméra", table: "astro_cameras", raw: c._raw ?? {} }));
    telescopes?.forEach(t => rows.push({ id: t.id, brand: t.brand, model: t.model, category: "Télescope", table: "astro_telescopes", raw: t._raw ?? {} }));
    mounts?.forEach(m => rows.push({ id: m.id, brand: m.brand, model: m.model, category: "Monture", table: "astro_mounts", raw: m._raw ?? {} }));
    filters?.forEach(f => rows.push({ id: f.id, brand: f.brand, model: f.model, category: "Filtre", table: "astro_filters", raw: f._raw ?? {} }));
    return rows;
  }, [cameras, telescopes, mounts, filters]);

  const filtered = useMemo(() => {
    if (!catFilter) return allRows;
    return allRows.filter(r => r.category === catFilter);
  }, [allRows, catFilter]);

  // Coverage stats
  const coverage = RETAILERS.map(r => ({
    ...r,
    count: allRows.filter(row => row.raw[`url_${r.key}`]).length,
    total: allRows.length,
  }));

  const handleSaveUrl = async (row: UrlRow, retailerKey: string) => {
    if (!editUrl.trim()) return;
    const { error } = await (supabase as any).from(row.table).update({ [`url_${retailerKey}`]: editUrl.trim() }).eq("id", row.id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("URL mise à jour !");
    setEditing(null);
    setEditUrl("");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3">
        {coverage.map(c => (
          <Card key={c.key} className="border-border/50 flex-1 min-w-[100px]">
            <CardContent className="p-2 text-center">
              <p className="text-sm font-bold font-mono text-foreground">{c.count}/{c.total}</p>
              <p className="text-[9px] text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChipFilter label="Catégorie" options={["Caméra", "Télescope", "Monture", "Filtre"]} selected={catFilter} onChange={setCatFilter} />

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-24">Marque</TableHead>
                <TableHead className="text-[10px] w-40">Modèle</TableHead>
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
                    const url = row.raw[`url_${r.key}`];
                    const editKey = `${row.id}|${r.key}`;
                    const isEditing = editing === editKey;

                    if (isEditing) {
                      return (
                        <TableCell key={r.key} className="p-1">
                          <div className="flex gap-0.5">
                            <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="h-5 text-[9px] px-1 w-24" placeholder="URL..." />
                            <button onClick={() => handleSaveUrl(row, r.key)} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={r.key} className="text-center">
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
                            <Check className="w-3 h-3 mx-auto" />
                          </a>
                        ) : (
                          <button onClick={() => { setEditing(editKey); setEditUrl(""); }} className="text-red-400/50 hover:text-red-400">
                            <X className="w-3 h-3 mx-auto" />
                          </button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && <p className="text-[10px] text-muted-foreground p-2 text-center">Affichage limité à 100 lignes ({filtered.length} total)</p>}
      </Card>
    </div>
  );
}
