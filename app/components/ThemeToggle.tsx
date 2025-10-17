"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    setMounted(true);
    
    // Get saved theme or default to system
    const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const initialTheme = saved || "system";
    setTheme(initialTheme);
    
    // Apply initial theme
    applyTheme(initialTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");
    
    let effectiveTheme: "light" | "dark";
    
    if (newTheme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effectiveTheme = newTheme;
    }
    
    console.log("Applying theme:", newTheme, "effective:", effectiveTheme);
    
    // Apply theme class to both html and body elements
    root.classList.add(effectiveTheme);
    body.classList.add(effectiveTheme);
    
    console.log("HTML classes after applying theme:", root.className);
    console.log("Body classes after applying theme:", body.className);
    
    // Force reflow to ensure styles are applied
    root.offsetHeight;
    body.offsetHeight;
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: newTheme, effectiveTheme } 
    }));
    
    localStorage.setItem("theme", newTheme);
  };

  const cycleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    console.log("Switching theme from", theme, "to", nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
    );
  }

  const getIcon = () => {
    if (theme === "system") {
      return <ComputerDesktopIcon className="w-5 h-5" />;
    }
    
    switch (theme) {
      case "dark":
        return <MoonIcon className="w-5 h-5" />;
      case "light":
        return <SunIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getTooltip = () => {
    const themeNames = {
      light: "Светлая",
      dark: "Тёмная", 
      system: "Авто (системная)"
    };
    
    const currentThemeName = themeNames[theme];
    const nextThemeName = theme === "light" ? "Тёмную" : theme === "dark" ? "Авто" : "Светлую";
    
    return `${currentThemeName} тема. Клик — переключить на ${nextThemeName}`;
  };

  const getCurrentThemeInfo = () => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      return systemTheme === "dark" ? "🌙 Тёмная (система)" : "☀️ Светлая (система)";
    }
    return theme === "dark" ? "🌙 Тёмная" : "☀️ Светлая";
  };

  return (
    <div className="relative">
      <button
        onClick={cycleTheme}
        className="group relative p-1.5 sm:p-2 rounded-lg bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
        title={getTooltip()}
      >
        <div className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200">
          {getIcon()}
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-lg bg-slate-200/50 dark:bg-slate-600/50 scale-0 group-active:scale-100 transition-transform duration-150" />
      </button>
      
      {/* Theme indicator */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {getCurrentThemeInfo()}
      </div>
    </div>
  );
}


