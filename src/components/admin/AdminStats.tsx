import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories, useRigPresets } from "@/hooks/useEquipmentCatalog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Telescope, Anchor, Filter, Wrench, Star, Layers, DollarSign } from "lucide-react";

function StatCard({ icon: Icon, label, total, withImage, color }: {
  icon: any; label: string; total: number; withImage?: number; color?: string;
}) {
  const pct = withImage != null && total > 0 ? Math.round((withImage / total) * 100) : null;
  const barColor = pct != null ? (pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500") : "bg-primary";

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color ?? "text-primary"}`} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold font-mono text-foreground">{total}</p>
        {pct != null && (
          <>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{withImage} avec image</span>
              <span>{total - withImage!} sans</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminStats() {
  const { data: cameras } = useCameras();
  const { data: telescopes } = useTelescopes();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const { data: accessories } = useAccessories();
  const { data: presets } = useRigPresets();

  const { data: celestialCount } = useQuery({
    queryKey: ["admin_celestial_count"],
    queryFn: async () => {
      const { count } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true });
      const { count: withImg } = await (supabase as any).from("celestial_objects").select("id", { count: "exact", head: true }).not("forced_image_url", "is", null);
      return { total: count ?? 0, withImage: withImg ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: priceCount } = useQuery({
    queryKey: ["admin_price_count"],
    queryFn: async () => {
      // Count products with at least one price across all 4 equipment tables
      let withPrice = 0;
      const retailers = ["amazon", "pierro_astro", "optique_unterlinden", "agena", "high_point_scientific", "astronome_fr", "astroshop_de", "univers_astro"];
      for (const table of ["astro_cameras", "astro_telescopes", "astro_mounts", "astro_filters"] as const) {
        const { data } = await (supabase as any).from(table).select("id, " + retailers.map(r => `price_${r}`).join(", "));
        if (data) {
          for (const row of data) {
            if (retailers.some(r => row[`price_${r}`] != null && row[`price_${r}`] > 0)) withPrice++;
          }
        }
      }
      return withPrice;
    },
    staleTime: 1000 * 60 * 10,
  });

  const camWithImg = cameras?.filter(c => c.image_url).length ?? 0;
  const scopeWithImg = telescopes?.filter(t => t.image_url).length ?? 0;
  const mntWithImg = mounts?.filter(m => m.image_url).length ?? 0;
  const filtWithImg = filters?.filter(f => f.image_url).length ?? 0;

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Produits</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Camera} label="Caméras" total={cameras?.length ?? 0} withImage={camWithImg} />
        <StatCard icon={Telescope} label="Télescopes" total={telescopes?.length ?? 0} withImage={scopeWithImg} />
        <StatCard icon={Anchor} label="Montures" total={mounts?.length ?? 0} withImage={mntWithImg} />
        <StatCard icon={Filter} label="Filtres" total={filters?.length ?? 0} withImage={filtWithImg} />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Infrastructure</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Wrench} label="Accessoires" total={accessories?.length ?? 0} />
        <StatCard icon={Star} label="Objets célestes" total={celestialCount?.total ?? 0} withImage={celestialCount?.withImage} />
        <StatCard icon={Layers} label="Presets" total={presets?.length ?? 0} />
        <StatCard icon={DollarSign} label="Produits avec prix" total={priceCount ?? 0} color="text-green-400" />
      </div>
    </div>
  );
}
