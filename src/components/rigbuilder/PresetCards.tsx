import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Telescope, Moon, Compass, DollarSign, Crown, Star, Aperture, Maximize, Zap,
} from "lucide-react";
import type { RigPreset } from "@/hooks/useEquipmentCatalog";

const USE_CASE_LABELS: Record<string, string> = {
  beginner_deepsky: "Beginner Deep Sky",
  intermediate_deepsky: "Intermediate Deep Sky",
  advanced_deepsky: "Advanced Deep Sky",
  widefield: "Wide Field",
  narrowband: "Narrowband",
  beginner_planetary: "Planetary",
  budget: "Budget",
  portable: "Portable / Travel",
  premium: "Premium",
};

const USE_CASE_ICONS: Record<string, React.ElementType> = {
  beginner_deepsky: Telescope,
  intermediate_deepsky: Telescope,
  advanced_deepsky: Aperture,
  widefield: Maximize,
  narrowband: Zap,
  beginner_planetary: Moon,
  budget: DollarSign,
  portable: Compass,
  premium: Crown,
};

interface PresetCardsProps {
  presets: RigPreset[];
  onLoad: (preset: RigPreset) => void;
}

export function PresetCards({ presets, onLoad }: PresetCardsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {presets.map((p) => {
        const Icon = USE_CASE_ICONS[p.use_case] ?? Telescope;
        const isFeatured = p.is_featured;
        return (
          <div
            key={p.id}
            className={`flex-shrink-0 w-[240px] max-h-[200px] rounded-lg border p-3 flex flex-col gap-2 bg-card transition-colors hover:border-primary/40 ${
              isFeatured ? "border-primary/30" : "border-border/50"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-sm text-foreground truncate">{p.name}</span>
              </div>
              {isFeatured && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                  Popular
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{USE_CASE_LABELS[p.use_case] ?? p.use_case}</span>
              <span className="text-primary">
                {"★".repeat(p.difficulty_level ?? 1)}
              </span>
            </div>

            {p.budget_min_eur != null && p.budget_max_eur != null && (
              <span className="text-xs font-mono text-primary">
                {p.budget_min_eur.toLocaleString()} – {p.budget_max_eur.toLocaleString()}€
              </span>
            )}

            <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1 leading-tight">
              {p.description_fr}
            </p>

            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs border-primary/30 hover:bg-primary/10"
              onClick={() => onLoad(p)}
            >
              Load this config
            </Button>
          </div>
        );
      })}
    </div>
  );
}
