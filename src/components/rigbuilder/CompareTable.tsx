import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, Globe, ShoppingCart, ExternalLink, Tag } from "lucide-react";
import { extractPrices } from "@/hooks/useEquipmentCatalog";
import { getFrRetailers } from "./EquipmentCard";
import { thumb400 } from "@/lib/utils";

interface CompareColumn<T> {
  label: string;
  render: (item: T) => string;
  bestDirection?: "higher" | "lower";
}

interface CompareTableProps<T extends { id: string; _raw?: Record<string, any> }> {
  items: T[];
  columns: CompareColumn<T>[];
  getName: (item: T) => string;
  getImage?: (item: T) => string | null;
  getAffiliates: (item: T) => { amazon: string | null; astro: string | null; manufacturer?: string | null };
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

export function CompareTable<T extends { id: string; _raw?: Record<string, any> }>({ items, columns, getName, getImage, getAffiliates }: CompareTableProps<T>) {
  const bestIndices: Record<number, number> = {};
  columns.forEach((col, ci) => {
    if (!col.bestDirection) return;
    const vals = items.map(item => parseNum(col.render(item)));
    const valid = vals.filter((v): v is number => v !== null);
    if (!valid.length) return;
    const target = col.bestDirection === "higher" ? Math.max(...valid) : Math.min(...valid);
    const idx = vals.findIndex(v => v === target);
    if (idx >= 0) bestIndices[ci] = idx;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Spec</TableHead>
                {items.map(item => (
                  <TableHead key={item.id} className="text-center font-semibold min-w-[140px]">
                    {getName(item)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {getImage && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground text-xs">Image</TableCell>
                  {items.map(item => {
                    const img = getImage(item);
                    return (
                      <TableCell key={item.id} className="text-center">
                        {img ? (
                          <div className="flex justify-center">
                            <img src={thumb400(img)} alt={getName(item)} loading="lazy" className="h-20 object-contain" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}

              <TableRow>
                <TableCell className="font-medium text-muted-foreground text-xs">
                  <div className="flex items-center gap-1"><Tag className="w-3 h-3" /> Best Price</div>
                </TableCell>
                {items.map(item => {
                  const { best, retailers } = extractPrices(item._raw ?? {});
                  return (
                    <TableCell key={item.id} className="text-center">
                      {best ? (
                        <div className="space-y-1">
                          <span className="font-bold text-primary text-sm">{best.price.toLocaleString()}€</span>
                          <div className="text-[9px] text-muted-foreground">{best.label}</div>
                          {retailers.length > 1 && (
                            <details className="text-left">
                              <summary className="text-[9px] text-muted-foreground cursor-pointer hover:text-foreground">
                                {retailers.length} retailers
                              </summary>
                              <div className="mt-1 space-y-0.5">
                                {retailers.map(r => (
                                  <div key={r.key} className="text-[9px] flex justify-between gap-2">
                                    <span className="text-muted-foreground">{r.label}</span>
                                    {r.url ? (
                                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono">
                                        {r.price!.toLocaleString()}€
                                      </a>
                                    ) : (
                                      <span className="font-mono">{r.price!.toLocaleString()}€</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {columns.map((col, ci) => (
                <TableRow key={col.label}>
                  <TableCell className="font-medium text-muted-foreground text-xs">{col.label}</TableCell>
                  {items.map((item, ii) => {
                    const isBest = bestIndices[ci] === ii;
                    return (
                      <TableCell key={item.id} className={`text-center font-mono text-sm ${isBest ? "text-primary font-bold" : ""}`}>
                        {col.render(item)}
                        {isBest && <span className="ml-1 text-[9px]">★</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              <TableRow>
                <TableCell className="font-medium text-muted-foreground text-xs">Links</TableCell>
                {items.map(item => {
                  const aff = getAffiliates(item);
                  return (
                    <TableCell key={item.id} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {aff.manufacturer && (
                          <a href={aff.manufacturer} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Manufacturer
                          </a>
                        )}
                        {aff.amazon && (
                          <a href={aff.amazon} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" /> Amazon
                          </a>
                        )}
                        {aff.astro && (
                          <a href={aff.astro} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Shop
                          </a>
                        )}
                        {!aff.amazon && !aff.astro && !aff.manufacturer && (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
