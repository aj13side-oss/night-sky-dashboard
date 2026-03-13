import { motion } from "framer-motion";

interface CompatibilityScoreProps {
  errors: number;
  warnings: number;
}

export function CompatibilityScore({ errors, warnings }: CompatibilityScoreProps) {
  const score = Math.max(0, Math.min(100, 100 - errors * 25 - warnings * 10));
  const color = score >= 80 ? "hsl(142 71% 45%)" : score >= 50 ? "hsl(var(--accent))" : "hsl(var(--destructive))";
  const label = score >= 80 ? "Good setup" : score >= 50 ? "Acceptable" : "Issues detected";

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx={32} cy={32} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
          <motion.circle
            cx={32} cy={32} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-xs">
        <p className="font-semibold text-foreground">{score}/100</p>
        <p className="text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}