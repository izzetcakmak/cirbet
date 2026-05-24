"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { LANGUAGES, type LangCode } from "@/lib/i18n";
import { useI18n } from "@/lib/i18nContext";

export function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white
                   transition-colors px-2 py-1 rounded-lg hover:bg-surface-2"
      >
        <Globe size={14} />
        <span>{current.flag}</span>
        <span className="font-medium">{current.short}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-44 bg-surface-2 border border-border
                          rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="max-h-72 overflow-y-auto">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as LangCode); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm
                    transition-colors text-left
                    ${lang === l.code
                      ? "bg-arc-600/20 text-arc-400"
                      : "text-gray-300 hover:bg-surface-3 hover:text-white"}`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span>{l.name}</span>
                  {lang === l.code && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-arc-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
