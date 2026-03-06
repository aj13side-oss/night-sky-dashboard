import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface EquipmentCardProps {
  selected: boolean;
  onToggle: () => void;
  imageUrl: string | null;
  title: string;
  specs: (string | null | undefined)[];
  affiliateAmazon: string | null;
  affiliateAstro: string | null;
}

export function EquipmentCard({ selected, onToggle, imageUrl, title, specs, affiliateAmazon, affiliateAstro }: EquipmentCardProps) {
  const filteredSpecs = specs.filter(Boolean) as string[];
  return (
    <Card
      className={`border-border/50 transition-all cursor-pointer hover:border-primary/40 ${selected ? "ring-2 ring-primary border-primary/50" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate flex-1 min-w-0">{title}</h3>
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
