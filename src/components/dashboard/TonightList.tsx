import { useTonightList } from "@/hooks/useTonightList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CelestialObject } from "@/hooks/useCelestialObjects";
import { useObjectImage } from "@/hooks/useObjectImage";
import { calculateAltitude } from "@/lib/visibility";
import { getObjectRiseSetTransit, formatTimeShort } from "@/lib/rise-set";
import { formatCatalogId } from "@/lib/format-catalog";
import { useObservation } from "@/contexts/ObservationContext";
import { ClipboardList, X, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";

const TonightList = () => {
  const { list, removeObject, clearList } = useTonightList();
  const { location } = useObservation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: objects } = useQuery({
    queryKey: ["tonight-list-objects", list],
    queryFn: async () => {
      if (!list.length) return [];
      const { data } = await (supabase as any)
        .from("celestial_objects")
        .select("*")
        .in("catalog_id", list);
      return (data ?? []) as CelestialObject[];
    },
    enabled: list.length > 0,
    staleTime: 60_000,
  });

  if (list.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">📋 Tonight's Observation List</h3>
          <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
        </button>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground" onClick={clearList}>
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-1.5">
          {(objects ?? []).map((obj) => (
            <TonightListRow key={obj.id} obj={obj} lat={location.lat} lng={location.lng} onRemove={() => removeObject(obj.catalog_id)} />
          ))}
          {list.length > 0 && (!objects || objects.length < list.length) && (
            <p className="text-[10px] text-muted-foreground">Loading objects...</p>
          )}
        </div>
      )}
    </div>
  );
};

const TonightListRow = ({ obj, lat, lng, onRemove }: { obj: CelestialObject; lat: number; lng: number; onRemove: () => void }) => {
  const alt = obj.ra != null && obj.dec != null ? calculateAltitude(obj.ra, obj.dec, lat, lng) : null;
  const rs = obj.ra != null && obj.dec != null ? getObjectRiseSetTransit(obj.ra, obj.dec, lat, lng, new Date()) : null;
  const { data: img } = useObjectImage(obj.catalog_id, obj.common_name, obj.ra, obj.dec, obj.size_max, obj.image_search_query, obj.forced_image_url, obj.obj_type);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="w-8 h-8 rounded bg-muted/40 overflow-hidden shrink-0">
        {img?.url && !imgErr ? (
          <img src={img.url} alt={obj.catalog_id} className="w-full h-full object-cover" loading="lazy" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground font-mono">DSO</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {formatCatalogId(obj)}
          {obj.common_name && <span className="text-primary font-normal ml-1">— {obj.common_name}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono">
          {alt != null ? `${alt.toFixed(0)}° alt` : ""}
          {rs && !rs.neverRises && !rs.isCircumpolar && rs.setTime ? ` · ↓${formatTimeShort(rs.setTime)}` : ""}
          {rs?.isCircumpolar ? " · All night" : ""}
        </p>
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default TonightList;
