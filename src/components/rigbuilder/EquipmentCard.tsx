import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, ExternalLink, Globe } from "lucide-react";

interface EquipmentCardProps {
  selected: boolean;
  onToggle: () => void;
  imageUrl: string | null;
  title: string;
  specs: (string | null | undefined)[];
  affiliateAmazon: string | null;
  affiliateAstro: string | null;
  manufacturerUrl?: string | null;
}

/** Append width param to common image CDNs or return raw URL at ~400px */
function thumb400(url: string): string {
  // Already a thumb / resized
  if (url.includes("w=") || url.includes("width=")) return url;
  // Supabase Storage – use transform
  if (url.includes("supabase.co/storage")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=400`;
  }
  return url;
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
}: EquipmentCardProps) {
  const filteredSpecs = specs.filter(Boolean) as string[];
  const hasLinks = affiliateAmazon || affiliateAstro || manufacturerUrl;

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
          <div className="rounded-lg overflow-hidden bg-secondary/20 flex items-center justify-center h-32">
            <img
              src={thumb400(imageUrl)}
              alt={title}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-2"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {filteredSpecs.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-mono">{s}</Badge>
          ))}
        </div>

        {hasLinks && (
          <div className="flex flex-wrap gap-3 pt-1" onClick={e => e.stopPropagation()}>
            {manufacturerUrl && (
              <a href={manufacturerUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <Globe className="w-3 h-3" /> Manufacturer
              </a>
            )}
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
