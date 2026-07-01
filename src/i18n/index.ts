import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import enAtlas from "@/locales/en/atlas.json";
import enObject from "@/locales/en/object.json";
import enDashboard from "@/locales/en/dashboard.json";
import enFooter from "@/locales/en/footer.json";
import enFov from "@/locales/en/fov.json";
import enEquipment from "@/locales/en/equipment.json";
import enLightPollution from "@/locales/en/lightpollution.json";
import enRigBuilder from "@/locales/en/rigbuilder.json";
import frCommon from "@/locales/fr/common.json";
import frAtlas from "@/locales/fr/atlas.json";
import frObject from "@/locales/fr/object.json";
import frDashboard from "@/locales/fr/dashboard.json";
import frFooter from "@/locales/fr/footer.json";
import frFov from "@/locales/fr/fov.json";
import frEquipment from "@/locales/fr/equipment.json";
import frLightPollution from "@/locales/fr/lightpollution.json";
import frRigBuilder from "@/locales/fr/rigbuilder.json";

export const defaultNS = "common";
export const resources = {
  en: { common: enCommon, atlas: enAtlas, object: enObject, dashboard: enDashboard, footer: enFooter, fov: enFov, equipment: enEquipment, lightpollution: enLightPollution, rigbuilder: enRigBuilder },
  fr: { common: frCommon, atlas: frAtlas, object: frObject, dashboard: frDashboard, footer: frFooter, fov: frFov, equipment: frEquipment, lightpollution: frLightPollution, rigbuilder: frRigBuilder },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS,
    ns: ["common", "atlas", "object", "dashboard", "footer", "fov", "equipment", "lightpollution", "rigbuilder"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export default i18n;
