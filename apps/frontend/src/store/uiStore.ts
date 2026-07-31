import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_VALUES = ['light', 'dark', 'system'] as const;

/** Converte a preferência (incluindo 'system') em tema efetivo aplicado no DOM. */
export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return pref;
}

interface UIState {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  language: string;
  dateFormat: string;
  timeFormat: '24h' | '12h';
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setLanguage: (lang: string) => void;
  setDateFormat: (format: string) => void;
  setTimeFormat: (format: '24h' | '12h') => void;
}

function applyThemeClass(pref: ThemePreference) {
  const resolved = resolveTheme(pref);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      language: 'pt-BR',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
      toggleTheme: () =>
        set((state) => {
          // Cicla entre os modos (system → dark → light → system)
          const idx = THEME_VALUES.indexOf(state.theme);
          const next = THEME_VALUES[(idx + 1) % THEME_VALUES.length];
          applyThemeClass(next);
          return { theme: next };
        }),
      setTheme: (theme) => {
        applyThemeClass(theme);
        return set({ theme });
      },
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setLanguage: (language) => set({ language }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    {
      name: 'studynotes-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
        dateFormat: state.dateFormat,
        timeFormat: state.timeFormat,
      }),
    }
  )
);
