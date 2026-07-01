import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AUTO_REDIRECT_KEY = "cf_autoredirect_done";
const LANG_CHOICE_KEY = "cf_lang_choice";
const BOT_UA = /(bot|googlebot|bingbot|crawler|spider)/i;

/**
 * Syncs i18next language with the URL path prefix.
 * `/fr/...` => French, anything else => English.
 * Also, on first load, auto-redirects French-speaking visitors to /fr
 * unless they've already made an explicit language choice.
 */
const LanguageRouteSync = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const redirectAttempted = useRef(false);

  // One-shot auto-redirect for francophone browsers.
  useEffect(() => {
    if (redirectAttempted.current) return;
    redirectAttempted.current = true;

    try {
      const isFrPath = pathname === "/fr" || pathname.startsWith("/fr/");
      if (isFrPath) return;

      if (typeof localStorage !== "undefined" && localStorage.getItem(LANG_CHOICE_KEY)) return;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(AUTO_REDIRECT_KEY)) return;

      const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
      if (BOT_UA.test(ua)) return;

      const langs = typeof navigator !== "undefined" ? navigator.languages : null;
      if (!langs || langs.length === 0) return;

      const isFrancophone = langs.some((l) => typeof l === "string" && l.toLowerCase().startsWith("fr"));
      if (!isFrancophone) return;

      try { sessionStorage.setItem(AUTO_REDIRECT_KEY, "1"); } catch { /* ignore */ }

      const nextPath = pathname === "/" ? "/fr" : `/fr${pathname}`;
      navigate(`${nextPath}${search}${hash}`, { replace: true });
    } catch {
      /* fail silently — never break navigation */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
