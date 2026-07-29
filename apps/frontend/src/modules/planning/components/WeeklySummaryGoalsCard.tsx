import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import type { Goal } from "../types";
import { isDateInRange } from "./planningDateUtils";

interface WeeklySummaryGoalsCardProps {
  goals: Goal[];
  weekStart: Date;
  weekEnd: Date;
}

export const WeeklySummaryGoalsCard: React.FC<WeeklySummaryGoalsCardProps> = ({
  goals,
  weekStart,
  weekEnd,
}) => {
  const completedCount = useMemo(
    () => goals.filter((g) => g.progress >= 100).length,
    [goals],
  );

  const pendingGoals = useMemo(
    () => goals.filter((g) => g.progress < 100).slice(0, 5),
    [goals],
  );

  const urgentGoals = useMemo(
    () =>
      goals.filter((g) => {
        if (g.progress >= 100) return false;
        if (!g.targetDate) return false;
        return isDateInRange(g.targetDate, weekStart, weekEnd);
      }),
    [goals, weekStart, weekEnd],
  );

  const totalPending = useMemo(
    () => goals.filter((g) => g.progress < 100).length,
    [goals],
  );

  return (
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
            {completedCount} concluídas
          </p>
        </div>
      </div>

      {/* Urgent chip */}
      {urgentGoals.length > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg">
          <span className="text-[11px] text-rose-500">⏰</span>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {urgentGoals.length}{" "}
            {urgentGoals.length === 1 ? "meta vence" : "metas vencem"} esta
            semana
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
                      <span
                        className="text-rose-400 flex-shrink-0"
                        title="Vence esta semana"
                      >
                        ⏰
                      </span>
                    )}
                    <span
                      className={`truncate ${
                        isUrgent
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-slate-700 dark:text-dark-200"
                      }`}
                    >
                      {goal.title}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isUrgent && (
                      <span className="text-[10px] font-semibold text-rose-500">
                        {new Date(goal.targetDate!).toLocaleDateString(
                          "pt-BR",
                          { weekday: "short", day: "numeric" },
                        )}
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
          {totalPending > 5 && (
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
  );
};
