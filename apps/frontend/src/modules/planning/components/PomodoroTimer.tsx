import React from 'react';
import { usePomodoroStore, formatPomodoroTime } from '../../../store/pomodoroStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';

interface PomodoroTimerProps {
  timerMode: 'focus' | 'break';
  timerState: 'idle' | 'running' | 'paused';
  timeLeft: number;
  progressPercent: number;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  timerMode,
  timerState,
  timeLeft,
  progressPercent,
}) => {
  const setTimerMode = usePomodoroStore((s) => s.setTimerMode);
  const setTaskName = usePomodoroStore((s) => s.setTaskName);
  const setTimeLeft = usePomodoroStore((s) => s.setTimeLeft);
  const taskName = usePomodoroStore((s) => s.taskName);
  const pomodoroDuration = usePlanningSettingsStore((s) => s.pomodoroDuration);
  const breakDuration = usePlanningSettingsStore((s) => s.breakDuration);

  return (
    <>
      {/* Timer Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface-hover)' }}>
        <button
          type="button"
          onClick={() => {
            if (timerState === 'idle') {
              setTimerMode('focus');
              setTimeLeft(pomodoroDuration * 60);
            }
          }}
          className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
          style={{
            background: timerMode === 'focus' ? 'var(--bg-surface)' : 'transparent',
            color: timerMode === 'focus' ? '#7C3AED' : 'var(--text-secondary)',
            boxShadow: timerMode === 'focus' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Foco
        </button>
        <button
          type="button"
          onClick={() => {
            if (timerState === 'idle') {
              setTimerMode('break');
              setTimeLeft(breakDuration * 60);
            }
          }}
          className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
          style={{
            background: timerMode === 'break' ? 'var(--bg-surface)' : 'transparent',
            color: timerMode === 'break' ? '#059669' : 'var(--text-secondary)',
            boxShadow: timerMode === 'break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Pausa
        </button>
      </div>

      {/* Task Name Input */}
      {timerState === 'idle' && timerMode === 'focus' && (
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="O que você vai estudar?"
          className="w-full max-w-xs px-4 py-2.5 rounded-xl text-sm text-center focus:outline-none transition-all"
          style={{
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      )}

      {/* Timer Display */}
      <div className="relative">
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none" stroke="currentColor" strokeWidth="4"
            style={{ color: 'var(--border-color)' }}
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none" stroke="currentColor" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercent / 100)}
            className={`transition-all duration-1000 ${
              timerMode === 'focus' ? 'text-violet-500' : 'text-emerald-500'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-heading font-extrabold tracking-tight"
            style={{ color: timerMode === 'focus' ? 'var(--text-primary)' : '#059669' }}
          >
            {formatPomodoroTime(timeLeft)}
          </span>
          <span className="text-xs font-semibold mt-1"
            style={{ color: timerMode === 'focus' ? 'var(--text-secondary)' : '#10B981' }}
          >
            {timerMode === 'focus' ? 'Foco' : 'Pausa'}
          </span>
        </div>
      </div>
    </>
  );
};
