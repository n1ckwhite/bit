"use client";

import { memo, useState } from "react";
import { useI18n } from "../contexts/I18nContext";

const LanguageSelector = memo(function LanguageSelector() {
  const { locale, setLocale, supported } = useI18n();
  const [open, setOpen] = useState(false);
  const listboxId = "lang-listbox";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-2.5 py-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-md text-sm text-slate-700 dark:text-slate-200"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label="Change language"
      >
        {locale.toUpperCase()}
      </button>
      {open && (
        <ul id={listboxId} role="listbox" aria-label="Language" className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 max-h-80 overflow-auto">
          {supported.map(l => (
            <li key={l}>
              <button
                type="button"
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${l===locale ? 'font-semibold' : ''}`}
                role="option"
                aria-selected={l===locale}
              >
                {l.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default LanguageSelector;


