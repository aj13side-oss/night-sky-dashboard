import { cn } from "@/lib/utils";

interface ChipFilterProps {
  label: string;
  options: string[];
  selected: string | null;
  onChange: (v: string | null) => void;
}

export function ChipFilter({ label, options, selected, onChange }: ChipFilterProps) {
  if (!options.length) return null;
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange(null)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
            selected === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          All
        </button>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(selected === opt ? null : opt)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              selected === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ToggleFilterProps {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  labelYes?: string;
  labelNo?: string;
}

export function ToggleFilter({ label, value, onChange, labelYes = "Yes", labelNo = "No" }: ToggleFilterProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">
        {([null, true, false] as const).map((v, i) => (
          <button
            key={i}
            onClick={() => onChange(v)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              value === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {v === null ? "All" : v ? labelYes : labelNo}
          </button>
        ))}
      </div>
    </div>
  );
}
