import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

const SOLAR_SYSTEM: TargetObject[] = [
  { name: "Jupiter", sizeArcmin: 0.7, exposureFast: null, exposureDeep: null, ra: null, dec: null },
  { name: "Saturn", sizeArcmin: 0.3, exposureFast: null, exposureDeep: null, ra: null, dec: null },
  { name: "Moon", sizeArcmin: 31, exposureFast: null, exposureDeep: null, ra: null, dec: null },
];

export interface TargetObject {
  name: string;
  sizeArcmin: number;
  exposureFast: number | null;
  exposureDeep: number | null;
  ra: number | null;
  dec: number | null;
}

interface Props {
  value: TargetObject | null;
  onChange: (obj: TargetObject) => void;
}

async function searchCatalog(term: string) {
  if (!term || term.length < 2) return [];
  const { data, error } = await supabase
    .rpc("fuzzy_search_celestial", { search_term: term, similarity_threshold: 0.15 });
  if (error) throw error;
  return (data ?? [])
    .filter((o: any) => o.size_max != null && o.size_max > 0)
    .slice(0, 15)
    .map((o: any) => ({
      name: o.common_name ? `${o.catalog_id} — ${o.common_name}` : o.catalog_id,
      sizeArcmin: o.size_max as number,
      exposureFast: o.exposure_guide_fast ?? null,
      exposureDeep: o.exposure_guide_deep ?? null,
      ra: o.ra_deg ?? null,
      dec: o.dec_deg ?? null,
    }));
}

const TargetObjectPicker = ({ value, onChange }: Props) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: results = [] } = useQuery({
    queryKey: ["fov-target-search", search],
    queryFn: () => searchCatalog(search),
    enabled: search.length >= 2,
    staleTime: 30_000,
  });

  const solarMatches = useMemo(() => {
    if (!search) return SOLAR_SYSTEM;
    return SOLAR_SYSTEM.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const allResults = [...solarMatches, ...results];

  return (
    <div className="space-y-2 relative">
      <Label className="text-xs text-muted-foreground">Target Object</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search catalog (M31, NGC 7000, Orion…)"
          value={open ? search : value?.name ?? ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="bg-secondary/50 pl-8 font-mono text-sm"
        />
      </div>
      {value && !open && (
        <p className="text-[10px] text-muted-foreground">
          Size: {value.sizeArcmin}' arcmin
        </p>
      )}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {allResults.length === 0 && search.length >= 2 && (
            <p className="text-xs text-muted-foreground p-3 text-center">No results</p>
          )}
          {allResults.map((obj, i) => (
            <button
              key={`${obj.name}-${i}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/20 flex justify-between items-center"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(obj);
                setSearch("");
                setOpen(false);
              }}
            >
              <span className="truncate">{obj.name}</span>
              <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                {obj.sizeArcmin}'
              </span>
            </button>
          ))}
          {search.length < 2 && (
            <p className="text-[10px] text-muted-foreground p-2 text-center">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TargetObjectPicker;
