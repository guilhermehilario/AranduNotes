import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanningSettingsState {
  // Durações Pomodoro (minutos)
  pomodoroDuration: number;
  breakDuration: number;

  // Toggles de notificação
  notifyEvents: boolean;
  notifyGoals: boolean;
  notifyPomodoro: boolean;
  notifyBrowser: boolean;

  // Ações
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
      pomodoroDuration: 25,
      breakDuration: 5,
      notifyEvents: true,
      notifyGoals: true,
      notifyPomodoro: true,
      notifyBrowser: true,

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
