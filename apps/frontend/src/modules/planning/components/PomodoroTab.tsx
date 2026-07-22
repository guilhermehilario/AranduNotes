import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Trash2,
  Timer,
  RotateCcw,
} from 'lucide-react';
import { usePomodoros, useCreatePomodoro, useUpdatePomodoro, useDeletePomodoro } from '../hooks/usePomodoro.ts';
import { usePomodoroStore, formatPomodoroTime } from '../../../store/pomodoroStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';

export const PomodoroTab: React.FC = () => {
  const { data: sessions = [], isLoading } = usePomodoros();
  const createPomodoro = useCreatePomodoro();
  const updatePomodoro = useUpdatePomodoro();
  const deletePomodoro = useDeletePomodoro();

  // Global store
  const timerMode = usePomodoroStore((s) => s.timerMode);
  const timerState = usePomodoroStore((s) => s.timerState);
  const timeLeft = usePomodoroStore((s) => s.timeLeft);
  const taskName = usePomodoroStore((s) => s.taskName);
  const currentSessionId = usePomodoroStore((s) => s.currentSessionId);
  const setTimerMode = usePomodoroStore((s) => s.setTimerMode);
  const setTaskName = usePomodoroStore((s) => s.setTaskName);
  const setTimeLeft = usePomodoroStore((s) => s.setTimeLeft);
  const setCurrentSessionId = usePomodoroStore((s) => s.setCurrentSessionId);
  const startTimer = usePomodoroStore((s) => s.startTimer);
  const pauseTimer = usePomodoroStore((s) => s.pauseTimer);
  const resetTimer = usePomodoroStore((s) => s.resetTimer);

  // Configurable durations from settings
  const pomodoroDuration = usePlanningSettingsStore((s) => s.pomodoroDuration);
  const breakDuration = usePlanningSettingsStore((s) => s.breakDuration);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const prevTimeLeftRef = useRef(timeLeft);

  // ── Detect timer completion and switch modes ──
  useEffect(() => {
    const justHitZero = prevTimeLeftRef.current === 1 && timeLeft === 0 && timerState === 'idle';
    const sessionExists = currentSessionId !== null;

    if (justHitZero) {
      if (timerMode === 'focus') {
        // Save completed session
        if (sessionExists) {
          updatePomodoro.mutate({ id: currentSessionId, input: { completed: true } });
        }
        // Switch to break mode
        setTimerMode('break');
        setTimeLeft(breakDuration * 60);
        setCurrentSessionId(null);
      } else {
        // Switch back to focus
        setTimerMode('focus');
        setTimeLeft(pomodoroDuration * 60);
      }
    }

    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, timerState, timerMode, currentSessionId, updatePomodoro, setTimerMode, setTimeLeft, setCurrentSessionId, pomodoroDuration, breakDuration]);

  const handleStartFocus = useCallback(async () => {
    try {
      const session = await createPomodoro.mutateAsync({
        taskName: taskName || undefined,
        duration: pomodoroDuration,
      });
      setCurrentSessionId(session.id);
      startTimer();
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao iniciar pomodoro.'), 'error');
    }
  }, [taskName, createPomodoro, setCurrentSessionId, startTimer]);

  const handleStart = useCallback(() => {
    if (timerMode === 'focus') {
      handleStartFocus();
    } else {
      startTimer();
    }
  }, [timerMode, handleStartFocus, startTimer]);

  const handleReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      deletePomodoro.mutate(id);
      setDeleteConfirmId(null);
    },
    [deletePomodoro],
  );

  const progressPercent = timerMode === 'focus'
    ? ((pomodoroDuration * 60 - timeLeft) / (pomodoroDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  const completedSessions = sessions.filter((s) => s.completed);
  const totalFocusMinutes = completedSessions.reduce((acc, s) => acc + s.duration, 0);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Timer Section */}
      <div className="lg:w-1/2">
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-8 flex flex-col items-center gap-6">
          {/* Timer Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-950 rounded-xl">
            <button
              type="button"
              onClick={() => {
                if (timerState === 'idle') {
                  setTimerMode('focus');
                  setTimeLeft(pomodoroDuration * 60);
                }
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timerMode === 'focus'
                  ? 'bg-white dark:bg-dark-800 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 dark:text-dark-400'
              }`}
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
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timerMode === 'break'
                  ? 'bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-dark-400'
              }`}
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
              className="w-full max-w-xs px-4 py-2.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-center text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            />
          )}

          {/* Timer Display */}
          <div className="relative">
            {/* Progress Ring */}
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100 dark:text-dark-800"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercent / 100)}
                className={`transition-all duration-1000 ${
                  timerMode === 'focus' ? 'text-violet-500' : 'text-emerald-500'
                }`}
              />
            </svg>

            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-heading font-extrabold tracking-tight ${
                timerMode === 'focus' ? 'text-slate-900 dark:text-dark-50' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formatPomodoroTime(timeLeft)}
              </span>
              <span className={`text-xs font-semibold mt-1 ${
                timerMode === 'focus' ? 'text-slate-400 dark:text-dark-400' : 'text-emerald-500'
              }`}>
                {timerMode === 'focus' ? 'Foco' : 'Pausa'}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            {timerState === 'idle' && (
              <button
                type="button"
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/20"
              >
                <Play className="h-5 w-5 fill-current" />
                {timerMode === 'focus' ? 'Iniciar Foco' : 'Iniciar Pausa'}
              </button>
            )}
            {timerState === 'running' && (
              <button
                type="button"
                onClick={pauseTimer}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Pause className="h-5 w-5 fill-current" />
                Pausar
              </button>
            )}
            {timerState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={startTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/20"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 rounded-xl font-semibold text-sm transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-700"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
            {timerState === 'running' && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 rounded-xl font-semibold text-sm transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-700"
                title="Parar"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="lg:w-1/2">
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
              Histórico de Sessões
            </h3>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-dark-400">Total de foco</p>
              <p className="text-lg font-heading font-extrabold text-violet-500">
                {totalFocusMinutes}min
              </p>
            </div>
          </div>

          {completedSessions.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-dark-400 text-center py-8">
              Nenhuma sessão concluída ainda.
            </p>
          )}

          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {completedSessions.slice(0, 20).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-dark-800"
              >
                <Timer className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-dark-200 truncate">
                    {session.taskName || 'Sessão de foco'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-dark-400">
                    {session.duration}min • {session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(session.id)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
        title="Excluir sessão"
        message="Tem certeza que deseja excluir esta sessão?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
