import { useState, useRef } from "react";
import AppNav from "@/components/AppNav";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Telescope } from "lucide-react";
import { useCameras, useTelescopes, useMounts, useFilters, useAccessories } from "@/hooks/useEquipmentCatalog";
import RigBuilderSection, { type RigPicks } from "@/components/rigbuilder/RigBuilderSection";
import { MonRigPanel } from "@/components/rigbuilder/MonRigPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const EquipmentProfile = () => {
  const isMobile = useIsMobile();
  const { data: telescopes } = useTelescopes();
  const { data: cameras } = useCameras();
  const { data: mounts } = useMounts();
  const { data: filters } = useFilters();
  const { data: accessories } = useAccessories();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [rigPicks, setRigPicks] = useState<RigPicks>({
    telescope: null, camera: null, mount: null, filterIds: [], accessories: [],
  });

  const handleRigPicksChange = (picks: RigPicks) => {
    setRigPicks(picks);
    // Scroll sidebar into view when preset loaded
    setTimeout(() => {
      sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const pickedTelescope = telescopes?.find(t => t.id === rigPicks.telescope) ?? null;
  const pickedCamera = cameras?.find(c => c.id === rigPicks.camera) ?? null;
  const pickedMount = mounts?.find(m => m.id === rigPicks.mount) ?? null;
  const pickedFilters = filters?.filter(f => rigPicks.filterIds.includes(f.id)) ?? [];
  const pickedAccessories = accessories?.filter(a => rigPicks.accessories.includes(a.id)) ?? [];

  const sidebar = (
    <MonRigPanel
      telescope={pickedTelescope}
      camera={pickedCamera}
      mount={pickedMount}
      filters={pickedFilters}
      accessories={pickedAccessories}
      onClearTelescope={() => setRigPicks(p => ({ ...p, telescope: null }))}
      onClearCamera={() => setRigPicks(p => ({ ...p, camera: null }))}
      onClearMount={() => setRigPicks(p => ({ ...p, mount: null }))}
      onRemoveFilter={(id) => setRigPicks(p => ({ ...p, filterIds: p.filterIds.filter(i => i !== id) }))}
      onRemoveAccessory={(id) => setRigPicks(p => ({ ...p, accessories: p.accessories.filter(i => i !== id) }))}
    />
  );

  return (
    <div className="min-h-screen bg-background star-field">
      <SEOHead
        title="Equipment Catalog & Rig Builder — Astrophotography"
        description="Compare 360+ astrophotography equipment: telescopes, cameras, mounts, filters. Build your rig, check compatibility, sampling and field of view."
        keywords="astrophoto equipment, rig builder, telescope comparison, astrophotography setup, gear comparator"
        path="/equipment"
      />
      <AppNav />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" /> Equipment Catalog
          </h1>
          <p className="text-muted-foreground mt-1">Browse gear, build your rig, and find the best targets for your setup.</p>
        </motion.div>

        {isMobile ? (
          <div className="space-y-8">
            <RigBuilderSection rigPicks={rigPicks} onRigPicksChange={handleRigPicksChange} />
            <div ref={sidebarRef} className="border-t border-border/50 pt-6">
              {sidebar}
            </div>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <RigBuilderSection rigPicks={rigPicks} onRigPicksChange={handleRigPicksChange} />
            </div>
            <div ref={sidebarRef} className="w-[320px] shrink-0 sticky top-20">
              {sidebar}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EquipmentProfile;
