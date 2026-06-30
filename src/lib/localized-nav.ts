import { useCallback } from "react";
import { useLocation, useNavigate, type NavigateOptions, type To } from "react-router-dom";

/**
 * Returns true if the current URL is on the French language route (`/fr` or `/fr/...`).
 */
export const useIsFrench = (): boolean => {
  const { pathname } = useLocation();
  return pathname === "/fr" || pathname.startsWith("/fr/");
};

const prefixPath = (path: string, isFr: boolean): string => {
  if (!isFr) return path;
  // Only prefix absolute, in-app paths.
  if (!path.startsWith("/")) return path;
  if (path === "/fr" || path.startsWith("/fr/")) return path;
  if (path === "/") return "/fr";
  return `/fr${path}`;
};

const prefixTo = (to: To, isFr: boolean): To => {
  if (typeof to === "string") return prefixPath(to, isFr);
  if (to && typeof to === "object" && typeof to.pathname === "string") {
    return { ...to, pathname: prefixPath(to.pathname, isFr) };
  }
  return to;
};

/**
 * Returns a function that prefixes an in-app path with `/fr` when the current
 * route is French. Use for `Link to=` and `<a href=` targets.
 */
export const useLocalizedPath = () => {
  const isFr = useIsFrench();
  return useCallback((path: string) => prefixPath(path, isFr), [isFr]);
};

/**
 * Wrapper around `useNavigate` that prefixes the target with `/fr` when on a
 * French route, so in-app navigation preserves the active language.
 */
export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const isFr = useIsFrench();
  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        navigate(to);
        return;
      }
      navigate(prefixTo(to, isFr), options);
    },
    [navigate, isFr],
  );
};
