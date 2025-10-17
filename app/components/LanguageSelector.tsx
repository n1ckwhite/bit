"use client";

import { memo, useState } from "react";
import { useI18n } from "../contexts/I18nContext";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  tr: "Türkçe",
  zh: "中文",
  it: "Italiano",
  pl: "Polski",
  cs: "Čeština",
  nl: "Nederlands",
  pt: "Português",
  ja: "日本語",
};

const LanguageSelector = memo(function LanguageSelector() {
  const { locale, setLocale, supported, t } = useI18n();
  const [open, setOpen] = useState(false);
  const listboxId = "lang-listbox";

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='px-2.5 py-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={t("changeLanguage")}
      >
        <span className='font-medium'>
          {LANGUAGE_NAMES[locale] || locale.toUpperCase()}
        </span>
      </button>
      {open && (
        <ul
          id={listboxId}
          role='listbox'
          aria-label={t("selectLanguage")}
          className='absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 max-h-80 overflow-auto'
        >
          {supported.map((l) => (
            <li key={l}>
              <button
                type='button'
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${
                  l === locale
                    ? "font-semibold bg-slate-50 dark:bg-slate-700"
                    : ""
                }`}
                role='option'
                aria-selected={l === locale}
              >
                <span>{LANGUAGE_NAMES[l] || l.toUpperCase()}</span>
                <span className='text-xs text-slate-500 dark:text-slate-400 font-mono'>
                  {l.toUpperCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default LanguageSelector;
