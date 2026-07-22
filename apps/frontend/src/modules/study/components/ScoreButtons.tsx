import React from 'react';
import type { StudyScore } from '../types';

interface ScoreButtonConfig {
  score: StudyScore;
  label: string;
  title: string;
  color: string;
}

const SCORE_BUTTONS: ScoreButtonConfig[] = [
  {
    score: 0,
    label: '0',
    title: 'Errei feio',
    color:
      'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-950/20 dark:border-rose-950/30 dark:text-rose-400',
  },
  {
    score: 1,
    label: '1',
    title: 'Errei',
    color:
      'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/10 dark:text-rose-300',
  },
  {
    score: 2,
    label: '2',
    title: 'Hesitei',
    color:
      'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400',
  },
  {
    score: 3,
    label: '3',
    title: 'Dificuldade',
    color:
      'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100 dark:bg-amber-950/10 dark:text-amber-300',
  },
  {
    score: 4,
    label: '4',
    title: 'Lembrei',
    color:
      'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/10 dark:text-emerald-350',
  },
  {
    score: 5,
    label: '5',
    title: 'Excelente',
    color:
      'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500',
  },
];

interface ScoreButtonsProps {
  onScoreSelect: (score: StudyScore, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ScoreButtons: React.FC<ScoreButtonsProps> = ({ onScoreSelect }) => {
  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom duration-250">
      <p className="text-xs font-bold text-center text-slate-400 dark:text-dark-400 uppercase tracking-wide">
        Como foi sua facilidade para lembrar do conteúdo?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {SCORE_BUTTONS.map((btn) => (
          <button
            key={btn.score}
            type="button"
            onClick={(e) => onScoreSelect(btn.score, e)}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border font-bold text-center text-sm transition-all duration-200 hover:scale-[1.04] cursor-pointer ${btn.color}`}
            title={btn.title}
          >
            <span>{btn.label}</span>
            <span className="text-[10px] font-medium opacity-80 truncate max-w-full">
              {btn.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScoreButtons;
