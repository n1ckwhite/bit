"use client";

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t, locale } = useI18n();

  const getIcon = () => {
    return theme === "dark" ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />;
  };

  const getTooltip = () => {
    const currentTheme = theme === 'dark' ? t('dark') : t('light');
    const nextTheme = theme === 'dark' ? t('light') : t('dark');
    return t('themeTooltip', { current: currentTheme, next: nextTheme });
  };

  const getCurrentThemeInfo = () => {
    const themeName = theme === 'dark' ? t('dark') : t('light');
    const icon = theme === 'dark' ? '🌙' : '☀️';
    return `${icon} ${themeName}`;
  };

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-lg bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors duration-200 flex items-center justify-center group"
        title={getTooltip()}
        aria-label={`Theme toggle. Current: ${getCurrentThemeInfo()}`}
      >
        <div className="text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200">
          {getIcon()}
        </div>
      </button>
    </div>
  );
}