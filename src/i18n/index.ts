import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import enAtlas from "@/locales/en/atlas.json";
import enObject from "@/locales/en/object.json";
import frCommon from "@/locales/fr/common.json";
import frAtlas from "@/locales/fr/atlas.json";
import frObject from "@/locales/fr/object.json";

export const defaultNS = "common";
export const resources = {
  en: { common: enCommon, atlas: enAtlas, object: enObject },
  fr: { common: frCommon, atlas: frAtlas, object: frObject },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS,
    ns: ["common", "atlas", "object"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export default i18n;
