'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {}, set: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('exec-theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    } catch {}
  }, []);

  // Reflect to DOM
  useEffect(() => {
    const root = document.querySelector('[data-exec]');
    if (root) root.setAttribute('data-theme', theme);
    try { localStorage.setItem('exec-theme', theme); } catch {}
  }, [theme]);

  return (
    <Ctx.Provider value={{
      theme,
      toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
      set: setTheme,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
