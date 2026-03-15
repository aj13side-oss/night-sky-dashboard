import { Link, useLocation } from "react-router-dom";
import { Telescope, Map, Crosshair, Home, Eclipse, Settings, Scale, EyeOff, Eye, Menu, LogIn, User, LogOut, Heart, Wrench, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/useUserRigs";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home, group: "plan" },
  { to: "/sky-atlas", label: "Atlas", icon: Map, group: "plan" },
  { to: "/fov-calculator", label: "FOV", icon: Crosshair, group: "plan" },
  { to: "/planner", label: "Planner", icon: ClipboardList, group: "plan" },
  { to: "/light-pollution", label: "Light Pollution", icon: Eclipse, group: "tools" },
  { to: "/rig-builder", label: "Rig Builder", icon: Scale, group: "tools" },
  { to: "/equipment", label: "Gear", icon: Settings, group: "tools" },
];

const AppNav = () => {
  const { pathname } = useLocation();
  const { userId, loading: authLoading } = useCurrentUser();
  const { count: favCount } = useFavorites();
  const { openAuthModal } = useAuthModal();
  const [nightVision, setNightVision] = useState(() => localStorage.getItem("nightVision") === "true");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("night-vision", nightVision);
    localStorage.setItem("nightVision", String(nightVision));
  }, [nightVision]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Telescope className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-gradient-gold">Cosmic Frame</span>
        </Link>

        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center gap-2">
          {!authLoading && !userId && (
            <button onClick={openAuthModal} className="text-xs text-muted-foreground hover:text-foreground">Sign In</button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background p-0 pt-8">
              <nav className="flex flex-col gap-1 px-3">
                {navItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      pathname === item.to ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.to === "/sky-atlas" && favCount > 0 && <Badge className="text-[8px] px-1 py-0 ml-auto">{favCount}</Badge>}
                  </Link>
                ))}
              </nav>
              <div className="px-3 pt-6 space-y-1">
                {userId && (
                  <>
                    <Link to="/sky-atlas?favorites=true" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                      <Heart className="w-4 h-4" /> My Favorites
                    </Link>
                    <button onClick={() => { handleSignOut(); setOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                )}
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
              <Link to={item.to}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === item.to ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.to === "/sky-atlas" && favCount > 0 && <Badge className="text-[8px] px-1 py-0">{favCount}</Badge>}
              </Link>
            </span>
          ))}

          <span className="w-px h-4 bg-border/40 mx-1.5" />

          <button onClick={() => setNightVision((v) => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              nightVision ? "bg-red-900/30 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={nightVision ? "Disable night vision" : "Enable night vision"}>
            {nightVision ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-xs">{nightVision ? "Normal" : "Night"}</span>
          </button>

          {/* Auth */}
          {!authLoading && (
            userId ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 ml-1">
                    <User className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/sky-atlas?favorites=true" className="gap-2"><Heart className="w-3.5 h-3.5" /> My Favorites</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rig-builder" className="gap-2"><Wrench className="w-3.5 h-3.5" /> My Setups</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/equipment" className="gap-2"><Settings className="w-3.5 h-3.5" /> My Gear</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={openAuthModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 ml-1">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default AppNav;
