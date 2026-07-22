import { create } from 'zustand';
import { usePlanningSettingsStore } from './planningSettingsStore.ts';

export type TimerMode = 'focus' | 'break';
export type TimerState = 'idle' | 'running' | 'paused';

// Default fallback values (override by planningSettingsStore)
export const POMODORO_DURATION = 25;
export const BREAK_DURATION = 5;

interface PomodoroState {
  timerMode: TimerMode;
  timerState: TimerState;
  timeLeft: number; // seconds
  taskName: string;
  currentSessionId: string | null;
  intervalId: ReturnType<typeof setInterval> | null;
  lastPomodoroDuration: number; // saved at session start for session saving
  lastBreakDuration: number;

  // Actions
  setTaskName: (name: string) => void;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setCurrentSessionId: (id: string | null) => void;
  setTimeLeft: (seconds: number) => void;
  setTimerState: (state: TimerState) => void;
  tick: () => boolean;
  cleanup: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  timerMode: 'focus',
  timerState: 'idle',
  timeLeft: POMODORO_DURATION * 60,
  taskName: '',
  currentSessionId: null,
  intervalId: null,
  lastPomodoroDuration: POMODORO_DURATION,
  lastBreakDuration: BREAK_DURATION,

  setTaskName: (name) => set({ taskName: name }),
  setTimerMode: (mode) => set({ timerMode: mode }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setTimeLeft: (seconds) => set({ timeLeft: seconds }),
  setTimerState: (state) => set({ timerState: state }),

  startTimer: () => {
    const state = get();
    if (state.intervalId) clearInterval(state.intervalId);

    set({ timerState: 'running' });

    const intervalId = setInterval(() => {
      const result = get().tick();
      if (result) {
        clearInterval(intervalId);
        set({ intervalId: null });
      }
    }, 1000);

    set({ intervalId });
  },

  pauseTimer: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null, timerState: 'paused' });
  },

  resetTimer: () => {
    const { intervalId } = get();
    const settings = usePlanningSettingsStore.getState();
    if (intervalId) clearInterval(intervalId);
    set({
      intervalId: null,
      timerMode: 'focus',
      timeLeft: settings.pomodoroDuration * 60,
      timerState: 'idle',
      currentSessionId: null,
      taskName: '',
    });
  },

  tick: () => {
    const { timeLeft } = get();
    if (timeLeft <= 1) {
      set({ timeLeft: 0, timerState: 'idle' });
      return true;
    }
    set({ timeLeft: timeLeft - 1 });
    return false;
  },

  cleanup: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null });
  },
}));

export function formatPomodoroTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
