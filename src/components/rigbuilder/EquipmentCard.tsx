import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, ExternalLink, Globe, Tag } from "lucide-react";
import { thumb400 } from "@/lib/utils";

interface EquipmentCardProps {
  selected: boolean;
  onToggle: () => void;
  imageUrl: string | null;
  title: string;
  specs: (string | null | undefined)[];
  affiliateAmazon: string | null;
  affiliateAstro: string | null;
  manufacturerUrl?: string | null;
  bestPrice?: { price: number; label: string; url: string | null } | null;
}

export function EquipmentCard({
  selected,
  onToggle,
  imageUrl,
  title,
  specs,
  affiliateAmazon,
  affiliateAstro,
  manufacturerUrl,
  bestPrice,
}: EquipmentCardProps) {
  const filteredSpecs = specs.filter(Boolean) as string[];
  const hasLinks = affiliateAmazon || affiliateAstro || manufacturerUrl;

  return (
    <Card
      className={`border-border/50 transition-all cursor-pointer hover:border-primary/40 ${selected ? "ring-2 ring-primary border-primary/50" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 flex-1 min-w-0 leading-tight">{title}</h3>
          <Checkbox checked={selected} className="mt-0.5 shrink-0 h-3.5 w-3.5" />
        </div>

        {imageUrl ? (
          <div className="rounded-md overflow-hidden bg-secondary/20 flex items-center justify-center aspect-square">
            <img
              src={thumb400(imageUrl)}
              alt={title}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-1.5"
            />
          </div>
        ) : (
          <div className="rounded-md bg-secondary/10 flex items-center justify-center aspect-square">
            <span className="text-muted-foreground text-[10px]">No image</span>
          </div>
        )}

        {bestPrice && (
          <div
            className="flex items-center gap-1 text-[10px]"
            onClick={e => e.stopPropagation()}
          >
            <Tag className="w-3 h-3 text-primary" />
            {bestPrice.url ? (
              <a href={bestPrice.url} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold">
                From {bestPrice.price.toLocaleString()}€
              </a>
            ) : (
              <span className="text-primary font-semibold">From {bestPrice.price.toLocaleString()}€</span>
            )}
            <span className="text-muted-foreground">({bestPrice.label})</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {filteredSpecs.slice(0, 4).map((s, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">{s}</Badge>
          ))}
          {filteredSpecs.length > 4 && (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">+{filteredSpecs.length - 4}</Badge>
          )}
        </div>

        {hasLinks && (
          <div className="flex flex-wrap gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
            {manufacturerUrl && (
              <a href={manufacturerUrl} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors">
                <Globe className="w-2.5 h-2.5" /> Site
              </a>
            )}
            {affiliateAmazon && (
              <a href={affiliateAmazon} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors">
                <ShoppingCart className="w-2.5 h-2.5" /> Amazon
              </a>
            )}
            {affiliateAstro && (
              <a href={affiliateAstro} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors">
                <ExternalLink className="w-2.5 h-2.5" /> Shop
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
