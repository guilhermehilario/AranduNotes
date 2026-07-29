import React from 'react';
import { usePomodoros } from '../hooks/usePomodoro.ts';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer.ts';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { PomodoroTimer } from './PomodoroTimer.tsx';
import { PomodoroControls } from './PomodoroControls.tsx';
import { PomodoroDurationSettings } from './PomodoroDurationSettings.tsx';
import { PomodoroHistory } from './PomodoroHistory.tsx';

export const PomodoroTab: React.FC = () => {
  const { data: sessions = [], isLoading } = usePomodoros();
  const {
    timerMode,
    timerState,
    timeLeft,
    progressPercent,
    handleStart,
    handleReset,
    pauseTimer,
    startTimer,
  } = usePomodoroTimer();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Timer Section — inside a single card as originally designed */}
      <div className="lg:w-1/2">
        <div className="rounded-2xl p-8 flex flex-col items-center gap-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
        >
          <PomodoroTimer
            timerMode={timerMode}
            timerState={timerState}
            timeLeft={timeLeft}
            progressPercent={progressPercent}
          />

          <PomodoroControls
            timerMode={timerMode}
            timerState={timerState}
            onStart={handleStart}
            onPause={pauseTimer}
            onResume={startTimer}
            onReset={handleReset}
          />

          <PomodoroDurationSettings />
        </div>
      </div>

      {/* History Section */}
      <div className="lg:w-1/2">
        <PomodoroHistory sessions={sessions} />
      </div>
    </div>
  );
};
