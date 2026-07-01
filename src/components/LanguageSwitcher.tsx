import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const LANG_STORAGE_KEY = "i18nextLng";

type Lang = "en" | "fr";

const stripFr = (pathname: string) =>
  pathname.replace(/^\/fr(?=\/|$)/, "") || "/";

const addFr = (pathname: string) =>
  pathname === "/" ? "/fr" : `/fr${pathname}`;

/**
 * Minimal accessible EN / FR segmented control.
 * - Switches i18next via URL (LanguageRouteSync handles changeLanguage).
 * - Preserves the rest of the path, query string, and hash.
 * - Persists the chosen language to localStorage (does NOT auto-redirect on load).
 */
const LanguageSwitcher = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const current: Lang =
    pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";

  const switchTo = (lang: Lang) => {
    if (lang === current) return;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      localStorage.setItem("cf_lang_choice", lang);
    } catch {
      /* localStorage may be unavailable (private mode); ignore */
    }
    const nextPath = lang === "fr" ? addFr(pathname) : stripFr(pathname);
    navigate(`${nextPath}${search}${hash}`);
  };

  const langs: Lang[] = ["en", "fr"];

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-lg border border-border/50 bg-secondary/30 p-0.5 text-xs",
        className,
      )}
    >
      {langs.map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => switchTo(lang)}
            aria-pressed={active}
            aria-label={lang === "en" ? "English" : "Français"}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium uppercase tracking-wide transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
