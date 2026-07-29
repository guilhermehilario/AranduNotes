import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface PomodoroControlsProps {
  timerMode: 'focus' | 'break';
  timerState: 'idle' | 'running' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const PomodoroControls: React.FC<PomodoroControlsProps> = ({
  timerMode,
  timerState,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  return (
    <div className="flex items-center gap-3">
      {timerState === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/20"
        >
          <Play className="h-5 w-5 fill-current" />
          {timerMode === 'focus' ? 'Iniciar Foco' : 'Iniciar Pausa'}
        </button>
      )}
      {timerState === 'running' && (
        <>
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Pause className="h-5 w-5 fill-current" />
            Pausar
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            style={{
              background: 'var(--bg-surface-hover)',
              color: 'var(--text-secondary)',
            }}
            title="Parar"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </>
      )}
      {timerState === 'paused' && (
        <>
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/20"
          >
            <Play className="h-5 w-5 fill-current" />
            Continuar
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            style={{
              background: 'var(--bg-surface-hover)',
              color: 'var(--text-secondary)',
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};
