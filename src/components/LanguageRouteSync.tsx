import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Syncs i18next language with the URL path prefix.
 * `/fr/...` => French, anything else => English.
 * Mounted inside <BrowserRouter> so useLocation works.
 */
const LanguageRouteSync = () => {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const isFr = pathname === "/fr" || pathname.startsWith("/fr/");
    const target = isFr ? "fr" : "en";
    if (i18n.language !== target) {
      i18n.changeLanguage(target);
    }
    document.documentElement.lang = target;
  }, [pathname, i18n]);

  return null;
};

export default LanguageRouteSync;
