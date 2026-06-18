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
        description="Compare 360+ astrophotography equipment: telescopes, astro cameras (ZWO, QHY, Player One), equatorial mounts (Sky-Watcher, iOptron, ZWO), filters and accessories. Build and check your rig compatibility."
        keywords="astrophoto equipment, rig builder, telescope comparison, astrophotography setup, gear comparator"
        canonical="https://cosmicframe.app/equipment"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What's the best telescope for beginner astrophotography?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "For beginners, a small apochromatic refractor (72–80mm) or a fast Newtonian (150–200mm) on a sturdy equatorial mount like the Sky-Watcher HEQ5 or ZWO AM5 is ideal. These setups are forgiving, relatively affordable, and capture bright wide-field targets beautifully while you learn tracking and polar alignment."
              }
            },
            {
              "@type": "Question",
              "name": "What is the best astrophotography camera for a beginner?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A cooled one-shot color camera such as the ZWO ASI533MC Pro or ASI2600MC Pro is a great first choice. They are easy to use, have low read noise, and deliver clean images without the complexity of mono filter wheels. For a tighter budget, uncooled models like the ZWO ASI585MC also perform well on bright targets."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need an equatorial mount for astrophotography?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. An equatorial mount rotates on an axis parallel to Earth's rotation, canceling star trailing during long exposures. Alt-az mounts can work for short exposures or with field derotators, but an equatorial mount (or a harmonic drive mount like the ZWO AM5) is the standard for serious deep sky imaging."
              }
            }
          ]
        }}
      />
      <AppNav />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Telescope className="w-8 h-8 text-primary" /> Astrophotography Equipment
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Compare the best telescopes, astrophotography cameras and equatorial mounts — from beginner setups to advanced rigs.
          </p>
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

        {/* FAQ Section */}
        <details className="space-y-4 pt-8 border-t border-border/20 mt-10">
          <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
            Frequently Asked Questions
          </summary>
          <div className="space-y-4 pt-4" itemScope itemType="https://schema.org/FAQPage">
            <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                What's the best telescope for beginner astrophotography?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                  For beginners, a small apochromatic refractor (72–80mm) or a fast Newtonian (150–200mm) on a sturdy equatorial mount like the Sky-Watcher HEQ5 or ZWO AM5 is ideal. These setups are forgiving, relatively affordable, and capture bright wide-field targets beautifully while you learn tracking and polar alignment.
                </p>
              </div>
            </div>
            <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                What is the best astrophotography camera for a beginner?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                  A cooled one-shot color camera such as the ZWO ASI533MC Pro or ASI2600MC Pro is a great first choice. They are easy to use, have low read noise, and deliver clean images without the complexity of mono filter wheels. For a tighter budget, uncooled models like the ZWO ASI585MC also perform well on bright targets.
                </p>
              </div>
            </div>
            <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <h3 itemProp="name" className="text-sm font-medium text-foreground/80">
                Do I need an equatorial mount for astrophotography?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                  Yes. An equatorial mount rotates on an axis parallel to Earth's rotation, canceling star trailing during long exposures. Alt-az mounts can work for short exposures or with field derotators, but an equatorial mount (or a harmonic drive mount like the ZWO AM5) is the standard for serious deep sky imaging.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* About Equipment Buying Guide */}
        <details className="space-y-6 pt-8 border-t border-border/20 mt-10">
          <summary className="text-sm font-medium text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors">
            About Astrophotography Equipment — Buying Guide
          </summary>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-sm font-medium text-foreground/70">Telescopes for astrophotography</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Refractors, Newtonians and apochromatic (APO) triplets each have different strengths. A small APO refractor (72–100mm) is the best beginner astrophotography telescope: it is lightweight, needs little backfocus adjustment, and delivers pinpoint stars across the frame. Newtonian reflectors (150–200mm) offer more aperture per euro but require precise collimation and coma correction. Schmidt-Cassegrains excel at planets and small galaxies but have long focal lengths that demand excellent tracking.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground/70">Astrophotography cameras</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Dedicated astro cameras beat DSLRs thanks to cooling, low read noise and high quantum efficiency. Cooled one-shot color (OSC) models like the ZWO ASI533MC Pro or ASI2600MC Pro are the easiest entry point. Mono cameras paired with LRGB or narrowband filters extract more detail but need a filter wheel. Uncooled options such as the ZWO ASI585MC or Player One Poseidon are budget-friendly for bright targets. QHY and Moravian offer larger sensors for full-frame setups.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground/70">Equatorial mounts</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                The mount is the most critical part of your rig. A good equatorial mount must carry at least 1.5× your total payload (telescope, camera, guidescope) for stable tracking. Belt-driven mounts like the Sky-Watcher HEQ5 and EQ6-R, or harmonic drive mounts like the ZWO AM5 and AM3, are popular choices. Check periodic error, guiding port compatibility, and whether the mount supports ASCOM or INDI for automated control.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground/70">Filters</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                Light pollution filters (Optolong L-Pro, IDAS LPS) help from suburban skies. Narrowband filters (Hydrogen-alpha, OIII, SII) isolate specific wavelengths and are essential for emission nebulae under heavy light pollution. Dual-band filters combine Ha and OIII in a single frame, offering a practical balance between convenience and signal. Choose the filter size (1.25″, 2″ or M48/M42 threaded) to match your optical train.
              </p>
            </div>
          </div>
        </details>
      </main>
      <Footer />
    </div>
  );
};

export default EquipmentProfile;
