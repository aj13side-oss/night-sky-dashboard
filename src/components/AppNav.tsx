import { Link, useLocation } from "react-router-dom";
import { Telescope, Map, Crosshair, Home, Eclipse, Settings, Scale, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  // Session planning
  { to: "/", label: "Dashboard", icon: Home, group: "plan" },
  { to: "/sky-atlas", label: "Atlas", icon: Map, group: "plan" },
  { to: "/fov-calculator", label: "FOV", icon: Crosshair, group: "plan" },
  // Reference tools
  { to: "/light-pollution", label: "Light Pollution", icon: Eclipse, group: "tools" },
  { to: "/rig-builder", label: "Rig Builder", icon: Scale, group: "tools" },
  { to: "/equipment", label: "Gear", icon: Settings, group: "tools" },
];

const AppNav = () => {
  const { pathname } = useLocation();
  const [nightVision, setNightVision] = useState(() => {
    return localStorage.getItem("nightVision") === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("night-vision", nightVision);
    localStorage.setItem("nightVision", String(nightVision));
  }, [nightVision]);

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Telescope className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-gradient-gold">Cosmic Frame</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item, i) => (
            <span key={item.to} className="flex items-center">
              {i > 0 && navItems[i - 1].group !== item.group && (
                <span className="w-px h-4 bg-border/40 mx-1.5 hidden sm:block" />
              )}
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === item.to
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </span>
          ))}

          <button
            onClick={() => setNightVision((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ml-2",
              nightVision
                ? "bg-red-900/30 text-red-400"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={nightVision ? "Disable night vision" : "Enable night vision"}
          >
            {nightVision ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-xs">{nightVision ? "Normal" : "Night"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppNav;
