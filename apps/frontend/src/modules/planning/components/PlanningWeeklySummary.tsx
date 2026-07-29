import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { useGoals } from "../hooks/useGoals";
import { usePomodoros } from "../hooks/usePomodoro";
import { getWeekBounds, isThisWeek } from "./planningDateUtils";
import { WeeklySummaryEventsCard } from "./WeeklySummaryEventsCard";
import { WeeklySummaryGoalsCard } from "./WeeklySummaryGoalsCard";
import { WeeklySummaryPomodoroCard } from "./WeeklySummaryPomodoroCard";

export const PlanningWeeklySummary: React.FC = () => {
  const { data: events = [] } = useEvents("agenda");
  const { data: goals = [] } = useGoals();
  const { data: pomodoros = [] } = usePomodoros();

  const weekKey = useMemo(() => {
    const { start } = getWeekBounds();
    return start.toISOString().split("T")[0];
  }, []);

  const weeklyEvents = useMemo(
    () =>
      events.filter((e) => e.status !== "completed" && isThisWeek(e.date)),
    [events, weekKey],
  );

  const { start: weekStart, end: weekEnd } = useMemo(
    () => getWeekBounds(),
    [weekKey],
  );

  const weeklyPomodoros = useMemo(
    () =>
      pomodoros.filter(
        (s) => s.completed && s.createdAt && isThisWeek(s.createdAt),
      ),
    [pomodoros, weekKey],
  );

  const hasData =
    weeklyEvents.length > 0 ||
    goals.some((g) => g.progress < 100) ||
    weeklyPomodoros.length > 0;

  if (!hasData) return null;

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
        <WeeklySummaryEventsCard events={weeklyEvents} />
        <WeeklySummaryGoalsCard
          goals={goals}
          weekStart={weekStart}
          weekEnd={weekEnd}
        />
        <WeeklySummaryPomodoroCard sessions={weeklyPomodoros} />
      </div>
    </div>
  );
};

export default PlanningWeeklySummary;
