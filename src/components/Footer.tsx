import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 mt-12 pt-10 pb-6 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-muted-foreground">
      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Outils</h4>
        <ul className="space-y-1">
          <li><Link to="/" className="hover:text-foreground transition-colors">Météo Astro & Dashboard</Link></li>
          <li><Link to="/sky-atlas" className="hover:text-foreground transition-colors">Atlas du Ciel (4 800+ objets)</Link></li>
          <li><Link to="/rig-builder" className="hover:text-foreground transition-colors">Comparateur Matériel Astro</Link></li>
          <li><Link to="/fov-calculator" className="hover:text-foreground transition-colors">Calculateur FOV & Échantillonnage</Link></li>
          <li><Link to="/light-pollution" className="hover:text-foreground transition-colors">Carte Pollution Lumineuse</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Objets populaires</h4>
        <p>
          Nébuleuse d'Orion (M42), Andromède (M31), Pléiades (M45),
          Nébuleuse du Voile, North America (NGC 7000),
          Rosette, Lagune (M8), Trifide (M20), Aigle (M16),
          Crabe (M1), Ring (M57), Dumbbell (M27)
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Matériel</h4>
        <p>
          Télescopes Newton, Réfracteurs APO, Schmidt-Cassegrain.
          Caméras ZWO, QHY, Player One.
          Montures Sky-Watcher, ZWO, iOptron.
          Filtres Optolong, Baader, Astronomik.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">Revendeurs partenaires</h4>
        <p>
          Pierro Astro, Astroshop.de, Astronome.fr,
          Optique Unterlinden, Amazon FR.
        </p>
        <p className="mt-4 text-muted-foreground/60">
          © {new Date().getFullYear()} AstroDash — par Cosmic Frame
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
