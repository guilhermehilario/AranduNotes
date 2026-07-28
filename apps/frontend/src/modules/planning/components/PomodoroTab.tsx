import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  Trash2,
  Timer,
  RotateCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { usePomodoros, useCreatePomodoro, useUpdatePomodoro, useDeletePomodoro } from '../hooks/usePomodoro.ts';
import { usePomodoroStore, formatPomodoroTime, POMODORO_DURATION, BREAK_DURATION } from '../../../store/pomodoroStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';

const ITEMS_PER_PAGE = 5;

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
  const [showDurationSettings, setShowDurationSettings] = useState(false);
  const [historyTab, setHistoryTab] = useState<'completed' | 'cancelled'>('completed');
  const [cancelledPage, setCancelledPage] = useState(0);
  const prevTimeLeftRef = useRef(timeLeft);

  // Settings store for duration controls
  const setPomodoroDuration = usePlanningSettingsStore((s) => s.setPomodoroDuration);
  const setBreakDuration = usePlanningSettingsStore((s) => s.setBreakDuration);

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
    // Capture current state before reset clears it
    const currentTimeLeft = usePomodoroStore.getState().timeLeft;
    const sessionId = usePomodoroStore.getState().currentSessionId;
    const totalSeconds = pomodoroDuration * 60;
    const elapsedSeconds = totalSeconds - currentTimeLeft;

    // Reset timer (clears timeLeft, sessionId, etc.)
    resetTimer();

    // Handle the session based on how long it actually ran
    if (!sessionId) return;
    if (elapsedSeconds >= 60) {
      // Ran for 1+ minute → keep as cancelled session with actual elapsed seconds
      updatePomodoro.mutate({
        id: sessionId,
        input: { completed: false, duration: elapsedSeconds },
      });
    } else {
      // Ran for less than 1 minute → remove entirely (including 0 seconds)
      deletePomodoro.mutate(sessionId);
    }
  }, [resetTimer, pomodoroDuration, updatePomodoro, deletePomodoro]);

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

  // Helper: format elapsed seconds as "Xmin Ys"
  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  };

  const completedSessions = sessions.filter((s) => s.completed);
  const totalFocusMinutes = completedSessions.reduce((acc, s) => acc + s.duration, 0);

  // ── Cancelled sessions: not completed (and actually ran for ≥1min, enforced at reset time) ──
  const cancelledSessions = useMemo(() => {
    return sessions
      .filter((s) => !s.completed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions]);

  const totalCancelledPages = Math.max(1, Math.ceil(cancelledSessions.length / ITEMS_PER_PAGE));
  const paginatedCancelled = cancelledSessions.slice(
    cancelledPage * ITEMS_PER_PAGE,
    (cancelledPage + 1) * ITEMS_PER_PAGE,
  );

  const handlePrevCancelledPage = useCallback(() => {
    setCancelledPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNextCancelledPage = useCallback(() => {
    setCancelledPage((p) => Math.min(totalCancelledPages - 1, p + 1));
  }, [totalCancelledPages]);

  // Reset page when switching to cancelled tab
  useEffect(() => {
    if (historyTab === 'cancelled') {
      setCancelledPage(0);
    }
  }, [historyTab]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Timer Section */}
      <div className="lg:w-1/2">
        <div className="rounded-2xl p-8 flex flex-col items-center gap-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
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
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer`}
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
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer`}
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
            {/* Progress Ring */}
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                style={{ color: 'var(--border-color)' }}
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
              <span className="text-5xl font-heading font-extrabold tracking-tight"
                style={{ color: timerMode === 'focus' ? 'var(--text-primary)' : '#059669' }}>
                {formatPomodoroTime(timeLeft)}
              </span>
              <span className="text-xs font-semibold mt-1"
                style={{ color: timerMode === 'focus' ? 'var(--text-secondary)' : '#10B981' }}>
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
            {timerState === 'running' && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                style={{
                  background: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)',
                }}
                title="Parar"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            )}
          </div>

          {/* Duration Settings - Collapsible */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setShowDurationSettings(!showDurationSettings)}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: showDurationSettings ? 'var(--bg-surface-hover)' : 'transparent',
                color: 'var(--text-secondary)',
              }}
            >
              <Settings className={`h-3.5 w-3.5 transition-transform duration-200 ${showDurationSettings ? 'rotate-45' : ''}`} />
              Durações
              <span className="ml-auto text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {pomodoroDuration}min foco / {breakDuration}min pausa
              </span>
            </button>

            {showDurationSettings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {/* Foco */}
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
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-heading font-extrabold text-violet-500">
                        {pomodoroDuration}
                      </span>
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
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
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

                {/* Pausa */}
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
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-heading font-extrabold text-emerald-500">
                        {breakDuration}
                      </span>
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
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
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
        </div>
      </div>

      {/* History Section */}
      <div className="lg:w-1/2">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          {/* Tabs: Concluídas / Canceladas */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-surface-hover)' }}>
              <button
                type="button"
                onClick={() => setHistoryTab('completed')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer`}
                style={{
                  background: historyTab === 'completed' ? 'var(--bg-surface)' : 'transparent',
                  color: historyTab === 'completed' ? '#7C3AED' : 'var(--text-secondary)',
                  boxShadow: historyTab === 'completed' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Concluídas
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('cancelled')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer`}
                style={{
                  background: historyTab === 'cancelled' ? 'var(--bg-surface)' : 'transparent',
                  color: historyTab === 'cancelled' ? '#EF4444' : 'var(--text-secondary)',
                  boxShadow: historyTab === 'cancelled' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Canceladas
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total de foco</p>
              <p className="text-lg font-heading font-extrabold text-violet-500">
                {totalFocusMinutes}min
              </p>
            </div>
          </div>

          {/* Completed Sessions */}
          {historyTab === 'completed' && (
            <>
              {completedSessions.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  Nenhuma sessão concluída ainda.
                </p>
              )}

              <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
                {completedSessions.slice(0, 20).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ border: '1px solid var(--border-color)' }}
                  >
                    <Timer className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {session.taskName || 'Sessão de foco'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {session.duration}min • {session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="p-1 rounded-lg transition-colors cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Cancelled Sessions */}
          {historyTab === 'cancelled' && (
            <>
              {cancelledSessions.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  Nenhuma sessão cancelada.
                </p>
              )}

              <div className="flex flex-col gap-1.5 min-h-[200px]">
                {paginatedCancelled.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ border: '1px solid var(--border-color)' }}
                  >
                    <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {session.taskName || 'Sessão de foco'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {formatElapsed(session.duration)} focados • {session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="p-1 rounded-lg transition-colors cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Arrows */}
              {cancelledSessions.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={handlePrevCancelledPage}
                    disabled={cancelledPage === 0}
                    className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {cancelledPage + 1} de {totalCancelledPages}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextCancelledPage}
                    disabled={cancelledPage >= totalCancelledPages - 1}
                    className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
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
