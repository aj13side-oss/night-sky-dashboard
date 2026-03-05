import { useState, useMemo } from "react";
import AppNav from "@/components/AppNav";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Telescope, Camera, Filter, Anchor, ExternalLink, Plus, X, ShoppingCart, Scale } from "lucide-react";
import {
  useCameras, useTelescopes, useMounts, useFilters,
  type AstroCamera, type AstroTelescope, type AstroMount, type AstroFilter,
} from "@/hooks/useEquipmentCatalog";

type Category = "telescopes" | "cameras" | "mounts" | "filters";

const RigBuilder = () => {
  const { data: cameras, isLoading: loadingCams } = useCameras();
  const { data: telescopes, isLoading: loadingScopes } = useTelescopes();
  const { data: mounts, isLoading: loadingMounts } = useMounts();
  const { data: filters, isLoading: loadingFilters } = useFilters();

  const [tab, setTab] = useState<Category>("telescopes");
  const [compareIds, setCompareIds] = useState<Record<Category, string[]>>({
    telescopes: [], cameras: [], mounts: [], filters: [],
  });

  const toggleCompare = (cat: Category, id: string) => {
    setCompareIds(prev => {
      const list = prev[cat];
      return {
        ...prev,
        [cat]: list.includes(id) ? list.filter(i => i !== id) : list.length < 4 ? [...list, id] : list,
      };
    });
  };

  const clearCompare = (cat: Category) => setCompareIds(prev => ({ ...prev, [cat]: [] }));

  const compareCount = compareIds[tab].length;

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Rig Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Comparez le matériel astro et trouvez le setup idéal. Sélectionnez jusqu'à 4 éléments pour les comparer.
          </p>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Category)}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="telescopes" className="gap-1.5">
              <Telescope className="w-3.5 h-3.5" /> Optiques
            </TabsTrigger>
            <TabsTrigger value="cameras" className="gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Caméras
            </TabsTrigger>
            <TabsTrigger value="mounts" className="gap-1.5">
              <Anchor className="w-3.5 h-3.5" /> Montures
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </TabsTrigger>
          </TabsList>

          {/* Compare bar */}
          {compareCount > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <span className="text-sm font-medium text-foreground">{compareCount} sélectionné(s)</span>
              <Button size="sm" variant="outline" onClick={() => clearCompare(tab)} className="gap-1">
                <X className="w-3 h-3" /> Vider
              </Button>
            </motion.div>
          )}

          {/* Telescopes */}
          <TabsContent value="telescopes">
            {loadingScopes ? <LoadingSkeleton /> : (
              <>
                <CatalogGrid>
                  {telescopes?.map(t => (
                    <EquipmentCard
                      key={t.id}
                      selected={compareIds.telescopes.includes(t.id)}
                      onToggle={() => toggleCompare("telescopes", t.id)}
                      imageUrl={t.image_url}
                      title={`${t.brand} ${t.model}`}
                      specs={[
                        t.focal_length_mm ? `${t.focal_length_mm}mm` : null,
                        t.aperture_mm ? `⌀${t.aperture_mm}mm` : null,
                        t.focal_length_mm && t.aperture_mm ? `f/${(t.focal_length_mm / t.aperture_mm).toFixed(1)}` : null,
                        t.type,
                        t.weight_kg ? `${t.weight_kg}kg` : null,
                      ]}
                      affiliateAmazon={t.affiliate_amazon}
                      affiliateAstro={t.affiliate_astro}
                    />
                  ))}
                </CatalogGrid>
                {compareIds.telescopes.length >= 2 && (
                  <CompareTable
                    items={telescopes?.filter(t => compareIds.telescopes.includes(t.id)) ?? []}
                    columns={[
                      { label: "Focale", render: t => t.focal_length_mm ? `${t.focal_length_mm}mm` : "—" },
                      { label: "Ouverture", render: t => t.aperture_mm ? `${t.aperture_mm}mm` : "—" },
                      { label: "f/D", render: t => t.focal_length_mm && t.aperture_mm ? `f/${(t.focal_length_mm / t.aperture_mm).toFixed(1)}` : "—" },
                      { label: "Type", render: t => t.type ?? "—" },
                      { label: "Poids", render: t => t.weight_kg ? `${t.weight_kg}kg` : "—" },
                    ]}
                    getName={t => `${t.brand} ${t.model}`}
                    getAffiliates={t => ({ amazon: t.affiliate_amazon, astro: t.affiliate_astro })}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Cameras */}
          <TabsContent value="cameras">
            {loadingCams ? <LoadingSkeleton /> : (
              <>
                <CatalogGrid>
                  {cameras?.map(c => (
                    <EquipmentCard
                      key={c.id}
                      selected={compareIds.cameras.includes(c.id)}
                      onToggle={() => toggleCompare("cameras", c.id)}
                      imageUrl={c.image_url}
                      title={`${c.brand} ${c.model}`}
                      specs={[
                        c.sensor_width_mm && c.sensor_height_mm ? `${c.sensor_width_mm}×${c.sensor_height_mm}mm` : null,
                        c.pixel_size_um ? `${c.pixel_size_um}µm` : null,
                        c.is_color !== null ? (c.is_color ? "Couleur" : "Mono") : null,
                      ]}
                      affiliateAmazon={c.affiliate_amazon}
                      affiliateAstro={c.affiliate_astro}
                    />
                  ))}
                </CatalogGrid>
                {compareIds.cameras.length >= 2 && (
                  <CompareTable
                    items={cameras?.filter(c => compareIds.cameras.includes(c.id)) ?? []}
                    columns={[
                      { label: "Capteur", render: c => c.sensor_width_mm && c.sensor_height_mm ? `${c.sensor_width_mm}×${c.sensor_height_mm}mm` : "—" },
                      { label: "Pixel", render: c => c.pixel_size_um ? `${c.pixel_size_um}µm` : "—" },
                      { label: "Type", render: c => c.is_color !== null ? (c.is_color ? "Couleur (OSC)" : "Mono") : "—" },
                    ]}
                    getName={c => `${c.brand} ${c.model}`}
                    getAffiliates={c => ({ amazon: c.affiliate_amazon, astro: c.affiliate_astro })}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Mounts */}
          <TabsContent value="mounts">
            {loadingMounts ? <LoadingSkeleton /> : (
              <>
                <CatalogGrid>
                  {mounts?.map(m => (
                    <EquipmentCard
                      key={m.id}
                      selected={compareIds.mounts.includes(m.id)}
                      onToggle={() => toggleCompare("mounts", m.id)}
                      imageUrl={m.image_url}
                      title={`${m.brand} ${m.model}`}
                      specs={[
                        m.payload_kg ? `Charge: ${m.payload_kg}kg` : null,
                        m.mount_weight_kg ? `Poids: ${m.mount_weight_kg}kg` : null,
                        m.mount_type,
                      ]}
                      affiliateAmazon={m.affiliate_amazon}
                      affiliateAstro={m.affiliate_astro}
                    />
                  ))}
                </CatalogGrid>
                {compareIds.mounts.length >= 2 && (
                  <CompareTable
                    items={mounts?.filter(m => compareIds.mounts.includes(m.id)) ?? []}
                    columns={[
                      { label: "Charge max", render: m => m.payload_kg ? `${m.payload_kg}kg` : "—" },
                      { label: "Poids", render: m => m.mount_weight_kg ? `${m.mount_weight_kg}kg` : "—" },
                      { label: "Type", render: m => m.mount_type ?? "—" },
                    ]}
                    getName={m => `${m.brand} ${m.model}`}
                    getAffiliates={m => ({ amazon: m.affiliate_amazon, astro: m.affiliate_astro })}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Filters */}
          <TabsContent value="filters">
            {loadingFilters ? <LoadingSkeleton /> : (
              <>
                <CatalogGrid>
                  {filters?.map(f => (
                    <EquipmentCard
                      key={f.id}
                      selected={compareIds.filters.includes(f.id)}
                      onToggle={() => toggleCompare("filters", f.id)}
                      imageUrl={f.image_url}
                      title={`${f.brand} ${f.model}`}
                      specs={[f.type, f.size]}
                      affiliateAmazon={f.affiliate_amazon}
                      affiliateAstro={f.affiliate_astro}
                    />
                  ))}
                </CatalogGrid>
                {compareIds.filters.length >= 2 && (
                  <CompareTable
                    items={filters?.filter(f => compareIds.filters.includes(f.id)) ?? []}
                    columns={[
                      { label: "Type", render: f => f.type ?? "—" },
                      { label: "Taille", render: f => f.size ?? "—" },
                    ]}
                    getName={f => `${f.brand} ${f.model}`}
                    getAffiliates={f => ({ amazon: f.affiliate_amazon, astro: f.affiliate_astro })}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// --- Sub-components ---

function CatalogGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">{children}</div>;
}

function EquipmentCard({ selected, onToggle, imageUrl, title, specs, affiliateAmazon, affiliateAstro }: {
  selected: boolean; onToggle: () => void;
  imageUrl: string | null; title: string;
  specs: (string | null | undefined)[];
  affiliateAmazon: string | null; affiliateAstro: string | null;
}) {
  const filteredSpecs = specs.filter(Boolean) as string[];
  return (
    <Card className={`border-border/50 transition-all cursor-pointer hover:border-primary/40 ${selected ? "ring-2 ring-primary border-primary/50" : ""}`}
      onClick={onToggle}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{title}</h3>
          </div>
          <Checkbox checked={selected} className="mt-0.5 shrink-0" />
        </div>

        {imageUrl && (
          <div className="rounded-lg overflow-hidden bg-secondary/20 flex items-center justify-center h-24">
            <img src={imageUrl} alt={title} className="max-h-full object-contain p-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {filteredSpecs.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-mono">{s}</Badge>
          ))}
        </div>

        {(affiliateAmazon || affiliateAstro) && (
          <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
            {affiliateAmazon && (
              <a href={affiliateAmazon} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <ShoppingCart className="w-3 h-3" /> Amazon
              </a>
            )}
            {affiliateAstro && (
              <a href={affiliateAstro} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <ExternalLink className="w-3 h-3" /> Astro-shop
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompareTable<T extends { id: string }>({ items, columns, getName, getAffiliates }: {
  items: T[];
  columns: { label: string; render: (item: T) => string }[];
  getName: (item: T) => string;
  getAffiliates: (item: T) => { amazon: string | null; astro: string | null };
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Comparaison
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
                <TableCell className="font-medium text-muted-foreground text-xs">Acheter</TableCell>
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

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default RigBuilder;
