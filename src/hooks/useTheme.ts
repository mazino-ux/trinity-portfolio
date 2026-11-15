import { useEffect, useState } from 'react';

export type ColorTheme = 'purple' | 'midnight' | 'emerald' | 'sunset' | 'monochrome';
export type ThemeMode = 'light' | 'dark';

export interface ThemeSwatch {
  id: ColorTheme;
  label: string;
  lightColor: string;
  darkColor: string;
}

export const THEME_SWATCHES: ThemeSwatch[] = [
  { id: 'purple', label: 'Purple', lightColor: '#3B0764', darkColor: '#C084FC' },
  { id: 'midnight', label: 'Midnight Blue', lightColor: '#0F294A', darkColor: '#60A5FA' },
  { id: 'emerald', label: 'Emerald', lightColor: '#064E3B', darkColor: '#34D399' },
  { id: 'sunset', label: 'Sunset Orange', lightColor: '#9A3412', darkColor: '#FB923C' },
  { id: 'monochrome', label: 'Monochrome', lightColor: '#111111', darkColor: '#F5F5F5' },
];

const STORAGE_COLOR_KEY = 'trinity_portfolio_color';
const STORAGE_MODE_KEY = 'trinity_portfolio_mode';

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or restricted iframe errors
  }
}

export function useTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = readStorage(STORAGE_COLOR_KEY);
    if (
      saved === 'purple' ||
      saved === 'midnight' ||
      saved === 'emerald' ||
      saved === 'sunset' ||
      saved === 'monochrome'
    ) {
      return saved;
    }
    return 'purple';
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = readStorage(STORAGE_MODE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', colorTheme);
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    writeStorage(STORAGE_COLOR_KEY, colorTheme);
    writeStorage(STORAGE_MODE_KEY, mode);
  }, [colorTheme, mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return {
    colorTheme,
    setColorTheme,
    mode,
    setMode,
    toggleMode,
  };
}
