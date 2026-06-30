import { Link, useLocation } from "react-router-dom";
import { Map, Crosshair, Home, Eclipse, Settings, EyeOff, Eye, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LocationPicker from "@/components/LocationPicker";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocalizedPath } from "@/lib/localized-nav";


const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: Home, group: "plan" },
  { to: "/sky-atlas", labelKey: "nav.atlas", icon: Map, group: "plan" },
  { to: "/fov-calculator", labelKey: "nav.fov", icon: Crosshair, group: "plan" },
  { to: "/light-pollution", labelKey: "nav.lightPollution", icon: Eclipse, group: "tools" },
  { to: "/equipment", labelKey: "nav.equipment", icon: Settings, group: "tools" },
];

const AppNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation("common");
  const lp = useLocalizedPath();
  const [nightVision, setNightVision] = useState(() => localStorage.getItem("nightVision") === "true");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("night-vision", nightVision);
    localStorage.setItem("nightVision", String(nightVision));
  }, [nightVision]);

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to={lp("/")} className="flex items-center gap-2">
          <img src="/logo.png" alt="Cosmic Frame" width={28} height={28} className="h-7 w-7" />
          <span className="text-xl font-bold text-gradient-gold hidden sm:inline">{t("brand")}</span>
        </Link>

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background p-0 pt-8">
              <div className="px-3 pb-4">
                <LocationPicker />
              </div>
              <nav className="flex flex-col gap-1 px-3">
                {navItems.map((item) => (
                  <Link key={item.to} to={lp(item.to)} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      pathname === lp(item.to) ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}>
                    <item.icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </Link>
                ))}
              </nav>
              <div className="px-3 pt-6 space-y-1">
                <LanguageSwitcher className="w-full" />
                <button onClick={() => setNightVision((v) => !v)}
                  className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors w-full",
                    nightVision ? "bg-red-900/30 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}>
                  {nightVision ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {nightVision ? "Normal Mode" : "Night Vision"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item, i) => (
            <span key={item.to} className="flex items-center">
              {i > 0 && navItems[i - 1].group !== item.group && (
                <span className="w-px h-4 bg-border/40 mx-1.5" />
              )}
              <Link to={lp(item.to)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === lp(item.to) ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                <item.icon className="w-3.5 h-3.5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </span>
          ))}

          <span className="w-px h-4 bg-border/40 mx-1.5" />

          <LocationPicker />

          <span className="w-px h-4 bg-border/40 mx-1.5" />

          <LanguageSwitcher />

          <span className="w-px h-4 bg-border/40 mx-1.5" />


          <button onClick={() => setNightVision((v) => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              nightVision ? "bg-red-900/30 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={nightVision ? "Disable night vision" : "Enable night vision"}>
            {nightVision ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-xs">{nightVision ? "Normal" : "Night"}</span>
          </button>

        </nav>
      </div>
    </header>
  );
};

export default AppNav;
