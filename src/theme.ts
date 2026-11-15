import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'fitness-takip:theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

/** Seçilen tema; seçim yoksa sistem ayarı geçerli. */
export function useTheme() {
  const [choice, setChoice] = useState<Theme | null>(stored);
  const [system, setSystem] = useState<Theme>(() => (media().matches ? 'dark' : 'light'));

  useEffect(() => {
    const m = media();
    const on = () => setSystem(m.matches ? 'dark' : 'light');
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);

  const theme = choice ?? system;

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.dataset.theme = choice;
    else delete root.dataset.theme;
    const color = theme === 'dark' ? '#11151B' : '#F3F4F1';
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color));
  }, [choice, theme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* yok say */
    }
  }, [theme]);

  return { theme, toggle };
}
