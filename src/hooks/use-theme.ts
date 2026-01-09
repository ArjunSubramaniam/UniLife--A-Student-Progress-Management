import { useEffect, useState } from 'react';
import { getTheme, saveTheme } from '@/utils/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    saveTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  return { theme, setTheme };
}

