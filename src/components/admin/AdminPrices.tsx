import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCameras, useTelescopes, useMounts, useFilters, extractPrices } from "@/hooks/useEquipmentCatalog";
import { ChipFilter } from "@/components/rigbuilder/ChipFilter";

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

type PriceRow = { id: string; brand: string; model: string; category: string; raw: Record<string, any> };

export default function AdminPrices() {
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);

  const allRows: PriceRow[] = useMemo(() => {
    const rows: PriceRow[] = [];
    cameras?.forEach(c => rows.push({ id: c.id, brand: c.brand, model: c.model, category: "Caméra", raw: c._raw ?? {} }));
    telescopes?.forEach(t => rows.push({ id: t.id, brand: t.brand, model: t.model, category: "Télescope", raw: t._raw ?? {} }));
    mounts?.forEach(m => rows.push({ id: m.id, brand: m.brand, model: m.model, category: "Monture", raw: m._raw ?? {} }));
    filters?.forEach(f => rows.push({ id: f.id, brand: f.brand, model: f.model, category: "Filtre", raw: f._raw ?? {} }));
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

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{totalPrices}</p>
          <p className="text-[10px] text-muted-foreground">prix récupérés</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{withAtLeastOne}</p>
          <p className="text-[10px] text-muted-foreground">produits avec ≥1 prix</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{allRows.length}</p>
          <p className="text-[10px] text-muted-foreground">produits total</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-4">
        <ChipFilter label="Catégorie" options={["Caméra", "Télescope", "Monture", "Filtre"]} selected={catFilter} onChange={setCatFilter} />
        <ChipFilter label="Prix" options={["with", "without"]} selected={priceFilter} onChange={setPriceFilter} />
      </div>

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
                    const price = row.raw[`price_${r.key}`];
                    return (
                      <TableCell key={r.key} className={`text-center text-[10px] font-mono ${price ? "text-green-400" : "text-muted-foreground/30"}`}>
                        {price ? `${Number(price).toLocaleString("fr-FR")}€` : "—"}
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
