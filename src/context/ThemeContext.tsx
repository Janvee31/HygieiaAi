'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function darkenColor(color: string, amount: number): string {
  if (color.startsWith('#')) {
    const r = Math.max(0, parseInt(color.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(color.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(color.slice(5, 7), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [themeColor, setThemeColor] = useState('#4F46E5'); // Default indigo color
  const [mounted, setMounted] = useState(false);

  // Load saved theme color from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem('hygieia-theme-color');
    if (savedColor) {
      setThemeColor(savedColor);
    }
  }, []);

  // Apply theme color to CSS variables for global access
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.style.setProperty('--theme-color', themeColor);
      root.style.setProperty('--theme-color-dark', darkenColor(themeColor, 30));
      root.style.setProperty('--theme-color-light', `${themeColor}80`);
      
      // Store the selected color in localStorage
      localStorage.setItem('hygieia-theme-color', themeColor);
      
      // Dispatch a custom event to notify components of theme change
      const themeEvent = new CustomEvent('theme-updated', { detail: { color: themeColor } });
      document.dispatchEvent(themeEvent);
      
      // Force a re-render of components by triggering a small DOM change
      document.body.classList.remove('theme-updated');
      setTimeout(() => {
        document.body.classList.add('theme-updated');
      }, 10);
    }
  }, [themeColor, mounted]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    themeColor,
    setThemeColor,
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <div 
        key={`theme-bg-${themeColor.replace('#', '')}`} // Force re-render when theme changes
        className="fixed inset-0 w-full min-h-screen"
        style={{
          background: `
            linear-gradient(135deg,
              ${darkenColor(themeColor, 60)} 0%,
              ${darkenColor(themeColor, 80)} 10%,
              ${darkenColor(themeColor, 100)} 20%,
              rgba(0, 0, 0, 1) 40%,
              rgba(0, 0, 0, 1) 60%,
              ${darkenColor(themeColor, 100)} 80%,
              ${darkenColor(themeColor, 80)} 90%,
              ${darkenColor(themeColor, 60)} 100%
            )
          `,
          zIndex: -1,
          transition: 'all 0.5s ease-in-out',
        }}
        data-theme-color={themeColor}
      />
      <div className="relative min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
