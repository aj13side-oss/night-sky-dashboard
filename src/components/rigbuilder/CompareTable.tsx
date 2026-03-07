import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, Globe, ShoppingCart, ExternalLink } from "lucide-react";

interface CompareTableProps<T extends { id: string }> {
  items: T[];
  columns: { label: string; render: (item: T) => string }[];
  getName: (item: T) => string;
  getImage?: (item: T) => string | null;
  getAffiliates: (item: T) => { amazon: string | null; astro: string | null; manufacturer?: string | null };
}

function thumb400(url: string): string {
  if (url.includes("w=") || url.includes("width=")) return url;
  if (url.includes("supabase.co/storage")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=400`;
  }
  return url;
}

export function CompareTable<T extends { id: string }>({ items, columns, getName, getImage, getAffiliates }: CompareTableProps<T>) {
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
              {/* Product image row */}
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

              {columns.map(col => (
                <TableRow key={col.label}>
                  <TableCell className="font-medium text-muted-foreground text-xs">{col.label}</TableCell>
                  {items.map(item => (
                    <TableCell key={item.id} className="text-center font-mono text-sm">
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Links row */}
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
                            <ExternalLink className="w-3 h-3" /> Astro-shop
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
