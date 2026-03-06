import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale } from "lucide-react";

interface CompareTableProps<T extends { id: string }> {
  items: T[];
  columns: { label: string; render: (item: T) => string }[];
  getName: (item: T) => string;
  getAffiliates: (item: T) => { amazon: string | null; astro: string | null };
}

export function CompareTable<T extends { id: string }>({ items, columns, getName, getAffiliates }: CompareTableProps<T>) {
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
                  <TableHead key={item.id} className="text-center font-semibold min-w-[120px]">
                    {getName(item)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
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
              <TableRow>
                <TableCell className="font-medium text-muted-foreground text-xs">Buy</TableCell>
                {items.map(item => {
                  const aff = getAffiliates(item);
                  return (
                    <TableCell key={item.id} className="text-center">
                      <div className="flex justify-center gap-2">
                        {aff.amazon && (
                          <a href={aff.amazon} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline">Amazon</a>
                        )}
                        {aff.astro && (
                          <a href={aff.astro} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline">Astro-shop</a>
                        )}
                        {!aff.amazon && !aff.astro && <span className="text-muted-foreground text-[10px]">—</span>}
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
