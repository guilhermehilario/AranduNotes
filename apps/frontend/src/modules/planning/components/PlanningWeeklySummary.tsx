import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Target,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents.ts';
import { useGoals } from '../hooks/useGoals.ts';
import { usePomodoros } from '../hooks/usePomodoro.ts';
import { Card } from '../../../components/ui/Card.tsx';
import { ProgressBar } from '../../../components/ui/ProgressBar.tsx';

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function isThisWeek(dateStr: string): boolean {
  const { start, end } = getWeekBounds();
  return isDateInRange(dateStr, start, end);
}

export const PlanningWeeklySummary: React.FC = () => {
  const { data: events = [] } = useEvents('agenda');
  const { data: goals = [] } = useGoals();
  const { data: pomodoros = [] } = usePomodoros();

  const weekKey = useMemo(() => {
    const { start } = getWeekBounds();
    return start.toISOString().split('T')[0];
  }, []);

  const weeklyEvents = useMemo(
    () => events.filter((e) => e.status !== 'completed' && isThisWeek(e.date)),
    [events, weekKey],
  );

  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekBounds(), [weekKey]);

  const pendingGoals = useMemo(
    () => goals.filter((g) => g.progress < 100).slice(0, 5),
    [goals, weekKey],
  );

  // Goals due this week
  const urgentGoals = useMemo(
    () => goals.filter((g) => {
      if (g.progress >= 100) return false;
      if (!g.targetDate) return false;
      return isDateInRange(g.targetDate, weekStart, weekEnd);
    }),
    [goals, weekStart, weekEnd],
  );

  const weeklyPomodoros = useMemo(
    () => pomodoros.filter((s) => s.completed && s.createdAt && isThisWeek(s.createdAt)),
    [pomodoros, weekKey],
  );

  // ── Pomodoro: group by day of week for mini bar chart ──
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const pomodoroByDay = useMemo(() => {
    const { start } = getWeekBounds();
    const dayMap: Record<string, { label: string; minutes: number; sessions: number }> = {};

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { label: dayLabels[i], minutes: 0, sessions: 0 };
    }

    // Add pomodoro data
    for (const s of weeklyPomodoros) {
      if (!s.createdAt) continue;
      const key = new Date(s.createdAt).toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].minutes += s.duration;
        dayMap[key].sessions += 1;
      }
    }

    return dayMap;
  }, [weeklyPomodoros, weekKey]);

  const dailyMinutes = Object.values(pomodoroByDay);
  const maxMinutes = Math.max(...dailyMinutes.map((d) => d.minutes), 1);

  const totalFocusMinutes = weeklyPomodoros.reduce((acc, s) => acc + s.duration, 0);

  const hasData = weeklyEvents.length > 0 || pendingGoals.length > 0 || weeklyPomodoros.length > 0;

  if (!hasData) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-extrabold text-slate-800 dark:text-dark-50 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-500" />
          Resumo da Semana
        </h2>
        <Link
          to="/planning/agenda"
          className="text-xs font-semibold text-violet-500 hover:text-violet-600 transition-colors flex items-center gap-0.5"
        >
          Ver planejamento
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Events Card */}
        <Card className="p-4 border border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
                Eventos
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-dark-400">
                {weeklyEvents.length} esta semana
              </p>
            </div>
          </div>

          {weeklyEvents.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-400 text-center py-3">
              Nenhum evento esta semana
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {weeklyEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-slate-700 dark:text-dark-200 font-medium">
                    {event.title}
                  </span>
                  <span className="text-slate-400 dark:text-dark-500 flex-shrink-0">
                    {formatDate(event.date)}
                  </span>
                </div>
              ))}
              {weeklyEvents.length > 4 && (
                <Link
                  to="/planning/agenda"
                  className="text-xs text-violet-500 hover:text-violet-600 font-semibold text-center pt-1"
                >
                  +{weeklyEvents.length - 4} mais
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Goals Card */}
        <Card className="p-4 border border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
                Metas
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-dark-400">
                {goals.filter((g) => g.progress >= 100).length} concluídas
              </p>
            </div>
          </div>

          {/* Urgent chip */}
          {urgentGoals.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg">
              <span className="text-[11px] text-rose-500">⏰</span>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {urgentGoals.length} {urgentGoals.length === 1 ? 'meta vence' : 'metas vencem'} esta semana
              </span>
            </div>
          )}

          {pendingGoals.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-400 text-center py-3">
              Todas as metas concluídas! 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingGoals.map((goal) => {
                const isUrgent = urgentGoals.some((ug) => ug.id === goal.id);
                return (
                  <div key={goal.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium truncate flex-1 mr-2">
                        {isUrgent && (
                          <span className="text-rose-400 flex-shrink-0" title="Vence esta semana">⏰</span>
                        )}
                        <span className={`truncate ${isUrgent ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-dark-200'}`}>
                          {goal.title}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isUrgent && (
                          <span className="text-[10px] font-semibold text-rose-500">
                            {new Date(goal.targetDate!).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-amber-500">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={goal.progress} max={100} />
                  </div>
                );
              })}
              {goals.filter((g) => g.progress < 100).length > 5 && (
                <Link
                  to="/planning/metas"
                  className="text-xs text-violet-500 hover:text-violet-600 font-semibold text-center pt-1"
                >
                  Ver todas as metas
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Pomodoro Card */}
        <Card className="p-4 border border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100">
                Pomodoro
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-dark-400">
                {totalFocusMinutes}min de foco
              </p>
            </div>
          </div>

          {weeklyPomodoros.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-400 text-center py-3">
              Nenhuma sessão esta semana
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Stats row */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xl font-heading font-extrabold text-emerald-500">
                    {weeklyPomodoros.length}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400">sessões</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-heading font-extrabold text-violet-500">
                    {totalFocusMinutes}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400">minutos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-heading font-extrabold text-amber-500">
                    {weeklyPomodoros.length > 0
                      ? Math.round(totalFocusMinutes / weeklyPomodoros.length)
                      : 0}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400">média/min</p>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end justify-between gap-1 pt-1 pb-2" style={{ height: '72px' }}>
                {dailyMinutes.map((day) => {
                  const heightPct = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                  return (
                    <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
                      {/* Tooltip */}
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-dark-400 leading-none transition-opacity">
                        {day.minutes > 0 ? day.minutes : ''}
                      </span>
                      {/* Bar */}
                      <div className="w-full flex justify-center items-end" style={{ height: '32px' }}>
                        <div
                          className="w-full max-w-[18px] rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max((day.minutes / maxMinutes) * 32, day.minutes > 0 ? 4 : 0)}px`,
                            backgroundColor: day.minutes > 0
                              ? `rgba(16, 185, 129, ${0.25 + (heightPct / 100) * 0.5})`
                              : 'transparent',
                          }}
                        />
                      </div>
                      {/* Day label */}
                      <span className={`text-[9px] font-semibold leading-none ${
                        day.minutes > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-300 dark:text-dark-600'
                      }`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Session list */}
              {weeklyPomodoros.slice(0, 2).map((session) => (
                <div key={session.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-slate-700 dark:text-dark-200 font-medium">
                    {session.taskName || 'Sessão de foco'}
                  </span>
                  <span className="text-slate-400 dark:text-dark-500 flex-shrink-0">
                    {session.duration}min
                  </span>
                </div>
              ))}
              <Link
                to="/planning/pomodoro"
                className="text-xs text-violet-500 hover:text-violet-600 font-semibold text-center pt-1"
              >
                Ver histórico completo
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PlanningWeeklySummary;
