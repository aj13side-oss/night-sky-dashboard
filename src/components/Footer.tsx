import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 mt-12 pt-10 pb-6 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-muted-foreground">
      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Tools</h4>
        <ul className="space-y-1">
          <li><Link to="/" className="hover:text-foreground transition-colors">Astro Weather & Dashboard</Link></li>
          <li><Link to="/sky-atlas" className="hover:text-foreground transition-colors">Sky Atlas (4,800+ objects)</Link></li>
          <li><Link to="/rig-builder" className="hover:text-foreground transition-colors">Astrophotography Gear Comparator</Link></li>
          <li><Link to="/fov-calculator" className="hover:text-foreground transition-colors">FOV & Sampling Calculator</Link></li>
          <li><Link to="/light-pollution" className="hover:text-foreground transition-colors">Light Pollution Map</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Popular Objects</h4>
        <p>
          Orion Nebula (M42), Andromeda (M31), Pleiades (M45),
          Veil Nebula, North America (NGC 7000),
          Rosette, Lagoon (M8), Trifid (M20), Eagle (M16),
          Crab (M1), Ring (M57), Dumbbell (M27)
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Equipment</h4>
        <p>
          Newton Telescopes, APO Refractors, Schmidt-Cassegrain.
          ZWO, QHY, Player One Cameras.
          Sky-Watcher, ZWO, iOptron Mounts.
          Optolong, Baader, Astronomik Filters.
        </p>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground/50">
          Links to third-party stores are provided for convenience. We are not affiliated with any retailer.
        </p>
        <p className="mt-4 text-muted-foreground/60">
          © {new Date().getFullYear()} Cosmic Frame
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
