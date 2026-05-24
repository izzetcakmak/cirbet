"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { LangCode } from "./i18n";
import { TRANSLATIONS } from "./i18n";
import type { Translations } from "./i18n";

interface I18nCtx {
  lang:   LangCode;
  setLang:(l: LangCode) => void;
  t:      (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang:    "en",
  setLang: () => {},
  t:       (k) => TRANSLATIONS.en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("cirbet_lang") as LangCode | null;
    if (saved && TRANSLATIONS[saved]) setLangState(saved);
  }, []);

  function setLang(l: LangCode) {
    setLangState(l);
    localStorage.setItem("cirbet_lang", l);
  }

  function t(key: keyof Translations): string {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key];
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
