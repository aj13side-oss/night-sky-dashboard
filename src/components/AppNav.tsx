import { Link, useLocation } from "react-router-dom";
import { Telescope, Map, Crosshair, Home, Sparkles, Eclipse, EyeOff, Eye, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/what-to-watch", label: "Tonight", icon: Sparkles },
  { to: "/sky-atlas", label: "Atlas", icon: Map },
  { to: "/fov-calculator", label: "FOV", icon: Crosshair },
  { to: "/light-pollution", label: "Dark Sky", icon: Eclipse },
  { to: "/equipment", label: "Gear", icon: Settings },
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
          <span className="text-xl font-bold text-gradient-gold">AstroDash</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
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
          ))}

          <button
            onClick={() => setNightVision((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ml-2",
              nightVision
                ? "bg-red-900/30 text-red-400"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={nightVision ? "Disable Night Vision" : "Enable Night Vision"}
          >
            {nightVision ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-xs">{nightVision ? "Night" : "Night"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppNav;
