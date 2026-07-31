import React, { useState, useMemo } from 'react';

// Constantes de data computadas uma vez no carregamento do módulo
const TODAY_STR = new Date().toISOString().split('T')[0];
const YESTERDAY_STR = new Date(Date.now() - 86400000).toISOString().split('T')[0];
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Target,
  BookOpen,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { studyService } from '../services/studyService';
import type { ReviewHistoryEntry } from '../services/studyService';
import { Card } from '../../../components/ui/Card.tsx';
import { StatsSkeleton } from './StatsSkeleton.tsx';

function getScoreLabel(score: number): string {
  if (score <= 1) return 'Esqueci';
  if (score <= 2) return 'Difícil';
  if (score <= 3) return 'Ok';
  if (score <= 4) return 'Fácil';
  return 'Perfeito';
}

function getScoreColor(score: number): string {
  if (score <= 1) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
  if (score <= 2) return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20';
  if (score <= 3) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
  if (score <= 4) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
  return 'text-brand-500 bg-brand-50 dark:bg-brand-950/20';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface DaySectionProps {
  entry: ReviewHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

const DaySection: React.FC<DaySectionProps> = ({ entry, isExpanded, onToggle }) => {
  const dateLabel = formatDate(entry.date);
  const isToday = dateLabel === 'Hoje';

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--bg-surface)',
        border: isToday ? '2px solid var(--color-brand-500, #7C3AED)' : '1px solid var(--border-color)',
      }}
    >
      {/* Day Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isToday
                ? 'bg-brand-100 dark:bg-brand-950/30'
                : 'bg-slate-100 dark:bg-dark-800'
            }`}
          >
            <Calendar
              className={`h-4 w-4 ${
                isToday ? 'text-brand-500' : 'text-slate-400 dark:text-dark-400'
              }`}
            />
          </div>
          <div className="text-left">
            <p
              className={`text-sm font-heading font-bold ${
                isToday
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-800 dark:text-dark-50'
              }`}
            >
              {dateLabel}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-dark-500">
              {entry.totalReviews} card{entry.totalReviews !== 1 ? 's' : ''} revisado{entry.totalReviews !== 1 ? 's' : ''}
              {entry.notebooks.length > 0 && ` • ${entry.notebooks.length} matéria${entry.notebooks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            {entry.notebooks.slice(0, 3).map((nb) => (
              <span
                key={nb.title}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: nb.color }}
              />
            ))}
            {entry.notebooks.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{entry.notebooks.length - 3}
              </span>
            )}
          </div>
          <span
            className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
              entry.avgScore >= 4
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
                : entry.avgScore >= 3
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
                  : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400'
            }`}
          >
            {entry.avgScore.toFixed(1)}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-0 space-y-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          {/* Notebook Breakdown */}
          {entry.notebooks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {entry.notebooks.map((nb) => (
                <div
                  key={nb.title}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
                  style={{
                    background: `${nb.color}15`,
                    color: nb.color,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: nb.color }}
                  />
                  <span>{nb.title}</span>
                  <span className="font-bold ml-0.5">{nb.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Individual Reviews */}
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {entry.reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${getScoreColor(review.score)}`}
                >
                  {review.score}
                </div>
                <div className="flex-grow min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {review.cardFront}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-semibold truncate"
                      style={{ color: review.notebookColor }}
                    >
                      {review.notebookTitle}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500">
                    {getScoreLabel(review.score)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-dark-500">
                    {formatTime(review.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StudyHistory: React.FC = () => {
  const { data: history, isLoading } = useQuery<ReviewHistoryEntry[]>({
    queryKey: ['study-history'],
    queryFn: () => studyService.getReviewHistory(),
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const todayStr = TODAY_STR;
  const yesterdayStr = YESTERDAY_STR;

  // Dias expandidos pelo usuário (qualquer dia que não seja hoje/ontem)
  const [expandedByUser, setExpandedByUser] = useState<Set<string>>(new Set());
  // Dias que o usuário colapsou (sobrescreve auto-expand de hoje/ontem)
  const [collapsedByUser, setCollapsedByUser] = useState<Set<string>>(new Set());

  // Auto-expande hoje e ontem + mantém expandidos pelo usuário
  const expandedDays = useMemo(() => {
    if (!history) return new Set(expandedByUser);
    const set = new Set(expandedByUser);
    for (const { date } of history) {
      if ((date === todayStr || date === yesterdayStr) && !collapsedByUser.has(date)) {
        set.add(date);
      }
    }
    return set;
  }, [history, collapsedByUser, expandedByUser, todayStr, yesterdayStr]);

  const toggleDay = (date: string) => {
    if (expandedDays.has(date)) {
      setCollapsedByUser((prev) => new Set(prev).add(date));
      setExpandedByUser((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    } else {
      setCollapsedByUser((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
      setExpandedByUser((prev) => new Set(prev).add(date));
    }
  };

  const totalReviews = history?.reduce((sum, d) => sum + d.totalReviews, 0) ?? 0;
  const avgScoreAll = history && history.length > 0
    ? history.reduce((sum, d) => sum + d.avgScore * d.totalReviews, 0) / totalReviews
    : 0;
  const activeDays = history?.length ?? 0;

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <BarChart3 className="h-10 w-10 text-slate-300 dark:text-dark-500 mb-3" />
        <p className="text-sm font-heading font-bold text-slate-600 dark:text-dark-200">
          Nenhum histórico de revisões
        </p>
        <p className="text-xs text-slate-400 dark:text-dark-500 mt-1 max-w-xs">
          Seu histórico de revisões aparecerá aqui conforme você for estudando seus flashcards.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <Brain className="h-4 w-4 text-brand-500" />
          <p className="text-lg font-heading font-extrabold text-slate-800 dark:text-dark-50">
            {totalReviews}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-dark-500 text-center leading-tight">
            Revisões<br />30 dias
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <Target className="h-4 w-4 text-emerald-500" />
          <p className="text-lg font-heading font-extrabold text-slate-800 dark:text-dark-50">
            {avgScoreAll.toFixed(1)}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-dark-500 text-center leading-tight">
            Média<br />de acertos
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <BookOpen className="h-4 w-4 text-amber-500" />
          <p className="text-lg font-heading font-extrabold text-slate-800 dark:text-dark-50">
            {activeDays}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-dark-500 text-center leading-tight">
            Dias<br />ativos
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-2">
        {history.map((entry) => (
          <DaySection
            key={entry.date}
            entry={entry}
            isExpanded={expandedDays.has(entry.date)}
            onToggle={() => toggleDay(entry.date)}
          />
        ))}
      </div>
    </div>
  );
};

export default StudyHistory;
