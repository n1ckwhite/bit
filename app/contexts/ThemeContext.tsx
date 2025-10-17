"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Only run on client side
    if (typeof window !== "undefined") {
      // Get saved theme from localStorage
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const currentTheme = savedTheme || "dark";
      
      // Check if theme is already applied to avoid duplicate application
      const htmlElement = document.documentElement;
      const hasThemeClass = htmlElement.classList.contains("light") || htmlElement.classList.contains("dark");
      
      setThemeState(currentTheme);
      
      // Only apply theme if it's not already applied
      if (!hasThemeClass) {
        applyTheme(currentTheme);
      }
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Apply new theme class
    root.classList.add(newTheme);
    
    // Save to localStorage
    localStorage.setItem("theme", newTheme);
    
    // Trigger custom event for components that need it
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: newTheme } 
    }));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Always provide context, but with different values during SSR
  const contextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
