import React from 'react';
import { Pause, Square, Timer, Play } from 'lucide-react';
import { usePomodoroStore, formatPomodoroTime } from '../../../store/pomodoroStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';

export const PomodoroFloatingTimer: React.FC = () => {
  const timerMode = usePomodoroStore((s) => s.timerMode);
  const timerState = usePomodoroStore((s) => s.timerState);
  const timeLeft = usePomodoroStore((s) => s.timeLeft);
  const taskName = usePomodoroStore((s) => s.taskName);
  const startTimer = usePomodoroStore((s) => s.startTimer);
  const pauseTimer = usePomodoroStore((s) => s.pauseTimer);
  const resetTimer = usePomodoroStore((s) => s.resetTimer);

  const pomodoroDuration = usePlanningSettingsStore((s) => s.pomodoroDuration);
  const breakDuration = usePlanningSettingsStore((s) => s.breakDuration);

  // Only show when timer is running or paused
  if (timerState === 'idle') return null;

  const isBreak = timerMode === 'break';
  const totalDuration = isBreak ? breakDuration * 60 : pomodoroDuration * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-[9990] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
          isBreak
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-violet-50/95 dark:bg-violet-950/90 border-violet-200 dark:border-violet-900/40'
        }`}
      >
        {/* Progress indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-dark-800/50 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-b-2xl ${
              isBreak ? 'bg-emerald-400' : 'bg-violet-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer icon */}
        <div className={`flex-shrink-0 ${isBreak ? 'text-emerald-500' : 'text-violet-500'}`}>
          <Timer className="h-5 w-5" />
        </div>

        {/* Timer display + task name */}
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-heading font-extrabold tracking-tight ${
            isBreak ? 'text-emerald-700 dark:text-emerald-300' : 'text-violet-700 dark:text-violet-300'
          }`}>
            {formatPomodoroTime(timeLeft)}
          </span>
          {taskName && timerMode === 'focus' && (
            <span className="text-[10px] text-slate-500 dark:text-dark-400 truncate max-w-[120px]">
              {taskName}
            </span>
          )}
          {isBreak && (
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold">
              Pausa
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {timerState === 'running' ? (
            <button
              type="button"
              onClick={pauseTimer}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isBreak
                  ? 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30'
              }`}
              title="Pausar"
            >
              <Pause className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startTimer}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isBreak
                  ? 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30'
              }`}
              title="Continuar"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            title="Parar"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroFloatingTimer;
