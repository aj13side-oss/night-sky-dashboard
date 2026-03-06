import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RangeFilterProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  step?: number;
}

export function RangeFilter({ label, unit, min, max, value, onChange, step = 1 }: RangeFilterProps) {
  if (min >= max) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-foreground">
          {value[0]}{unit} – {value[1]}{unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
    </div>
  );
}
