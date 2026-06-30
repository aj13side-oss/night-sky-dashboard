import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/localized-nav";

const Footer = () => {
  const lp = useLocalizedPath();
  const { t } = useTranslation("footer");
  return (
  <footer className="border-t border-border/30 mt-12 pt-10 pb-6 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-muted-foreground">
      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">{t("columns.tools")}</h4>
        <ul className="space-y-1">
          <li><Link to={lp("/")} className="hover:text-foreground transition-colors">{t("tools.dashboard")}</Link></li>
          <li><Link to={lp("/sky-atlas")} className="hover:text-foreground transition-colors">{t("tools.atlas")}</Link></li>
          <li><Link to={lp("/equipment")} className="hover:text-foreground transition-colors">{t("tools.equipment")}</Link></li>
          <li><Link to={lp("/fov-calculator")} className="hover:text-foreground transition-colors">{t("tools.fov")}</Link></li>
          <li><Link to={lp("/light-pollution")} className="hover:text-foreground transition-colors">{t("tools.lightPollution")}</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">{t("columns.popularObjects")}</h4>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {[
            {name:"Orion Nebula (M42)", id:"M 42"},
            {name:"Andromeda (M31)", id:"M 31"},
            {name:"Pleiades (M45)", id:"M 45"},
            {name:"Veil Nebula", id:"NGC 6992"},
            {name:"North America (NGC 7000)", id:"NGC 7000"},
            {name:"Rosette", id:"NGC 2237"},
            {name:"Lagoon (M8)", id:"M 8"},
            {name:"Trifid (M20)", id:"M 20"},
            {name:"Eagle (M16)", id:"M 16"},
            {name:"Crab (M1)", id:"M 1"},
            {name:"Ring (M57)", id:"M 57"},
            {name:"Dumbbell (M27)", id:"M 27"},
          ].map(o => (
            <a key={o.id} href={lp(`/object/${encodeURIComponent(o.id)}`)}
              className="hover:text-foreground transition-colors">
              {o.name}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-foreground/80 mb-2">{t("columns.equipment")}</h4>
        <p>{t("equipmentText")}</p>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground/50">
          {t("disclaimer")}
        </p>
        <p className="mt-4 text-muted-foreground/60 flex items-center gap-2">
          <img src="/icon-192.png" alt="Cosmic Frame" width={20} height={20} loading="lazy" className="w-5 h-5 rounded-full" />
          © {new Date().getFullYear()} Cosmic Frame
          <a href={lp("/privacy")} className="text-xs text-muted-foreground hover:text-foreground ml-4">
            {t("privacy")}
          </a>
        </p>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
