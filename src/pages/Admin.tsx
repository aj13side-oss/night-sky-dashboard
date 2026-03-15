import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppNav from "@/components/AppNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ImageIcon, Star, DollarSign, Link, Layers, Terminal, ShieldCheck, LogOut, Database, Activity, Search as SearchIcon, Wrench, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminStats from "@/components/admin/AdminStats";
import AdminImageAudit from "@/components/admin/AdminImageAudit";
import AdminCelestialAudit from "@/components/admin/AdminCelestialAudit";
import AdminPrices from "@/components/admin/AdminPrices";
import AdminUrls from "@/components/admin/AdminUrls";
import AdminPresets from "@/components/admin/AdminPresets";
import AdminLogs from "@/components/admin/AdminLogs";
import AdminEquipmentCRUD from "@/components/admin/AdminEquipmentCRUD";
import AdminDataQuality from "@/components/admin/AdminDataQuality";
import AdminFunctions from "@/components/admin/AdminFunctions";
import AdminSEO from "@/components/admin/AdminSEO";
import AdminSolarSystemAudit from "@/components/admin/AdminSolarSystemAudit";

const Admin = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }

      const { data: isAdmin } = await (supabase as any).rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setAuthed(true);
      setChecking(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthed(false); navigate("/admin/login"); }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (checking || !authed) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Cosmic Frame content management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </Button>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="stats" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Stats</TabsTrigger>
            <TabsTrigger value="equipment" className="gap-1.5 text-xs"><Wrench className="w-3.5 h-3.5" /> Equipment</TabsTrigger>
            <TabsTrigger value="images" className="gap-1.5 text-xs"><ImageIcon className="w-3.5 h-3.5" /> Equip. Images</TabsTrigger>
            <TabsTrigger value="celestial" className="gap-1.5 text-xs"><Star className="w-3.5 h-3.5" /> Celestial</TabsTrigger>
            <TabsTrigger value="prices" className="gap-1.5 text-xs"><DollarSign className="w-3.5 h-3.5" /> Prices</TabsTrigger>
            <TabsTrigger value="urls" className="gap-1.5 text-xs"><Link className="w-3.5 h-3.5" /> URLs</TabsTrigger>
            <TabsTrigger value="presets" className="gap-1.5 text-xs"><Layers className="w-3.5 h-3.5" /> Presets</TabsTrigger>
            <TabsTrigger value="quality" className="gap-1.5 text-xs"><Database className="w-3.5 h-3.5" /> Quality</TabsTrigger>
            <TabsTrigger value="functions" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Functions</TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5 text-xs"><SearchIcon className="w-3.5 h-3.5" /> SEO</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5 text-xs"><Terminal className="w-3.5 h-3.5" /> Logs</TabsTrigger>
            <TabsTrigger value="solar" className="gap-1.5 text-xs"><Globe2 className="w-3.5 h-3.5" /> Solar System</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><AdminStats /></TabsContent>
          <TabsContent value="equipment"><AdminEquipmentCRUD /></TabsContent>
          <TabsContent value="images"><AdminImageAudit /></TabsContent>
          <TabsContent value="celestial"><AdminCelestialAudit /></TabsContent>
          <TabsContent value="prices"><AdminPrices /></TabsContent>
          <TabsContent value="urls"><AdminUrls /></TabsContent>
          <TabsContent value="presets"><AdminPresets /></TabsContent>
          <TabsContent value="quality"><AdminDataQuality /></TabsContent>
          <TabsContent value="functions"><AdminFunctions /></TabsContent>
          <TabsContent value="seo"><AdminSEO /></TabsContent>
          <TabsContent value="logs"><AdminLogs /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
