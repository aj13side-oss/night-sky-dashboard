import { Link, useLocation } from "react-router-dom";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggles between English (root) and French (/fr/...) for the current path.
 * Pure <Link> navigation so React Router updates and LanguageRouteSync flips i18next.
 */
const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { pathname, search, hash } = useLocation();
  const isFr = pathname === "/fr" || pathname.startsWith("/fr/");

  const toEn = isFr ? pathname.replace(/^\/fr(?=\/|$)/, "") || "/" : pathname;
  const toFr = isFr ? pathname : `/fr${pathname === "/" ? "" : pathname}` || "/fr";
  const target = isFr ? toEn : toFr;
  const nextLabel = isFr ? "EN" : "FR";
  const currentLabel = isFr ? "FR" : "EN";

  return (
    <Link
      to={`${target}${search}${hash}`}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        className,
      )}
      title={`Switch to ${nextLabel === "FR" ? "Français" : "English"}`}
      aria-label={`Switch language to ${nextLabel}`}
    >
      <Languages className="w-3.5 h-3.5" />
      <span className="font-medium">{currentLabel}</span>
      <span className="opacity-50">/</span>
      <span>{nextLabel}</span>
    </Link>
  );
};

export default LanguageSwitcher;
