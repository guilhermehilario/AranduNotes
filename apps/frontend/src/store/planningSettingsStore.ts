import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlanningAccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'sky';

export const ACCENT_COLORS: { id: PlanningAccentColor; label: string; hex: string; ring: string }[] = [
  { id: 'violet', label: 'Violeta', hex: '#8b5cf6', ring: 'ring-violet-500' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6', ring: 'ring-blue-500' },
  { id: 'emerald', label: 'Verde', hex: '#10b981', ring: 'ring-emerald-500' },
  { id: 'amber', label: 'Âmbar', hex: '#f59e0b', ring: 'ring-amber-500' },
  { id: 'rose', label: 'Rosa', hex: '#f43f5e', ring: 'ring-rose-500' },
  { id: 'sky', label: 'Céu', hex: '#0ea5e9', ring: 'ring-sky-500' },
];

interface PlanningSettingsState {
  // Cores
  accentColor: PlanningAccentColor;

  // Durações Pomodoro (minutos)
  pomodoroDuration: number;
  breakDuration: number;

  // Toggles de notificação
  notifyEvents: boolean;
  notifyGoals: boolean;
  notifyPomodoro: boolean;
  notifyBrowser: boolean;

  // Ações
  setAccentColor: (color: PlanningAccentColor) => void;
  setPomodoroDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  setNotifyEvents: (value: boolean) => void;
  setNotifyGoals: (value: boolean) => void;
  setNotifyPomodoro: (value: boolean) => void;
  setNotifyBrowser: (value: boolean) => void;
}

export const usePlanningSettingsStore = create<PlanningSettingsState>()(
  persist(
    (set) => ({
      accentColor: 'violet',
      pomodoroDuration: 25,
      breakDuration: 5,
      notifyEvents: true,
      notifyGoals: true,
      notifyPomodoro: true,
      notifyBrowser: true,

      setAccentColor: (accentColor) => set({ accentColor }),
      setPomodoroDuration: (pomodoroDuration) => set({ pomodoroDuration }),
      setBreakDuration: (breakDuration) => set({ breakDuration }),
      setNotifyEvents: (notifyEvents) => set({ notifyEvents }),
      setNotifyGoals: (notifyGoals) => set({ notifyGoals }),
      setNotifyPomodoro: (notifyPomodoro) => set({ notifyPomodoro }),
      setNotifyBrowser: (notifyBrowser) => set({ notifyBrowser }),
    }),
    {
      name: 'studynotes-planning-settings',
    },
  ),
);
