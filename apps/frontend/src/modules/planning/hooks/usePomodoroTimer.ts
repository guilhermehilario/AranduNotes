import { useCallback, useEffect, useRef } from 'react';
import { usePomodoroStore } from '../../../store/pomodoroStore.ts';
import { usePlanningSettingsStore } from '../../../store/planningSettingsStore.ts';
import { useToastStore } from '../../../store/toastStore.ts';
import { useCreatePomodoro, useUpdatePomodoro, useDeletePomodoro } from './usePomodoro.ts';
import { extractApiError } from '../../../utils/api-errors.ts';

export function usePomodoroTimer() {
  const createPomodoro = useCreatePomodoro();
  const updatePomodoro = useUpdatePomodoro();
  const deletePomodoro = useDeletePomodoro();

  const timerMode = usePomodoroStore((s) => s.timerMode);
  const timerState = usePomodoroStore((s) => s.timerState);
  const timeLeft = usePomodoroStore((s) => s.timeLeft);
  const taskName = usePomodoroStore((s) => s.taskName);
  const currentSessionId = usePomodoroStore((s) => s.currentSessionId);
  const setTimerMode = usePomodoroStore((s) => s.setTimerMode);
  const setTimeLeft = usePomodoroStore((s) => s.setTimeLeft);
  const setCurrentSessionId = usePomodoroStore((s) => s.setCurrentSessionId);
  const startTimer = usePomodoroStore((s) => s.startTimer);
  const pauseTimer = usePomodoroStore((s) => s.pauseTimer);
  const resetTimer = usePomodoroStore((s) => s.resetTimer);

  const pomodoroDuration = usePlanningSettingsStore((s) => s.pomodoroDuration);
  const breakDuration = usePlanningSettingsStore((s) => s.breakDuration);

  const prevTimeLeftRef = useRef(timeLeft);

  // ── Detect timer completion and switch modes ──
  useEffect(() => {
    const justHitZero = prevTimeLeftRef.current === 1 && timeLeft === 0 && timerState === 'idle';
    const sessionExists = currentSessionId !== null;

    if (justHitZero) {
      if (timerMode === 'focus') {
        if (sessionExists) {
          updatePomodoro.mutate({ id: currentSessionId, input: { completed: true } });
        }
        setTimerMode('break');
        setTimeLeft(breakDuration * 60);
        setCurrentSessionId(null);
      } else {
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
  }, [taskName, createPomodoro, setCurrentSessionId, startTimer, pomodoroDuration]);

  const handleStart = useCallback(() => {
    if (timerMode === 'focus') {
      handleStartFocus();
    } else {
      startTimer();
    }
  }, [timerMode, handleStartFocus, startTimer]);

  const handleReset = useCallback(() => {
    const currentTimeLeft = usePomodoroStore.getState().timeLeft;
    const sessionId = usePomodoroStore.getState().currentSessionId;
    const totalSeconds = pomodoroDuration * 60;
    const elapsedSeconds = totalSeconds - currentTimeLeft;

    resetTimer();

    if (!sessionId) return;
    if (elapsedSeconds >= 60) {
      updatePomodoro.mutate({
        id: sessionId,
        input: { completed: false, duration: elapsedSeconds },
      });
    } else {
      deletePomodoro.mutate(sessionId);
    }
  }, [resetTimer, pomodoroDuration, updatePomodoro, deletePomodoro]);

  const progressPercent = timerMode === 'focus'
    ? ((pomodoroDuration * 60 - timeLeft) / (pomodoroDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  return {
    timerMode,
    timerState,
    timeLeft,
    taskName,
    progressPercent,
    pomodoroDuration,
    breakDuration,
    handleStart,
    handleReset,
    pauseTimer,
    startTimer,
    handleStartFocus,
  };
}
