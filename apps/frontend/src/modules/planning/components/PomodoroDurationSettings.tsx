import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import { usePomodoroStore, POMODORO_DURATION, BREAK_DURATION } from '../../../store/pomodoroStore.ts';

export const PomodoroDurationSettings: React.FC = () => {
  const pomodoroDuration = usePlanningSettingsStore((s) => s.pomodoroDuration);
  const breakDuration = usePlanningSettingsStore((s) => s.breakDuration);
  const setPomodoroDuration = usePlanningSettingsStore((s) => s.setPomodoroDuration);
  const setBreakDuration = usePlanningSettingsStore((s) => s.setBreakDuration);

  const timerState = usePomodoroStore((s) => s.timerState);
  const timerMode = usePomodoroStore((s) => s.timerMode);
  const setTimeLeft = usePomodoroStore((s) => s.setTimeLeft);

  const [show, setShow] = React.useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        style={{
          background: show ? 'var(--bg-surface-hover)' : 'transparent',
          color: 'var(--text-secondary)',
        }}
      >
        <Settings className={`h-3.5 w-3.5 transition-transform duration-200 ${show ? 'rotate-45' : ''}`} />
        Durações
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {pomodoroDuration}min foco / {breakDuration}min pausa
        </span>
      </button>

      {show && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {/* Focus Duration */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
            <label className="text-[10px] font-bold uppercase tracking-wide block mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Tempo de Foco
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.max(5, pomodoroDuration - 5);
                  setPomodoroDuration(newVal);
                  if (timerState === 'idle' && timerMode === 'focus') setTimeLeft(newVal * 60);
                }}
                className="w-9 h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-base"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-heading font-extrabold text-violet-500">{pomodoroDuration}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}> min</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.min(60, pomodoroDuration + 5);
                  setPomodoroDuration(newVal);
                  if (timerState === 'idle' && timerMode === 'focus') setTimeLeft(newVal * 60);
                }}
                className="w-9 h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-base"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPomodoroDuration(POMODORO_DURATION);
                if (timerState === 'idle' && timerMode === 'focus') setTimeLeft(POMODORO_DURATION * 60);
              }}
              className="mt-2 text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RotateCcw className="h-2.5 w-2.5" /> Restaurar padrão ({POMODORO_DURATION}min)
            </button>
          </div>

          {/* Break Duration */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
            <label className="text-[10px] font-bold uppercase tracking-wide block mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Tempo de Pausa
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.max(1, breakDuration - 1);
                  setBreakDuration(newVal);
                  if (timerState === 'idle' && timerMode === 'break') setTimeLeft(newVal * 60);
                }}
                className="w-9 h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-base"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-heading font-extrabold text-emerald-500">{breakDuration}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}> min</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.min(30, breakDuration + 1);
                  setBreakDuration(newVal);
                  if (timerState === 'idle' && timerMode === 'break') setTimeLeft(newVal * 60);
                }}
                className="w-9 h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-base"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setBreakDuration(BREAK_DURATION);
                if (timerState === 'idle' && timerMode === 'break') setTimeLeft(BREAK_DURATION * 60);
              }}
              className="mt-2 text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RotateCcw className="h-2.5 w-2.5" /> Restaurar padrão ({BREAK_DURATION}min)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
