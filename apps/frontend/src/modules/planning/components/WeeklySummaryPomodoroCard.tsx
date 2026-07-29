import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Timer } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import type { PomodoroSession } from "../types";

interface WeeklySummaryPomodoroCardProps {
  sessions: PomodoroSession[];
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export const WeeklySummaryPomodoroCard: React.FC<
  WeeklySummaryPomodoroCardProps
> = ({ sessions }) => {
  const totalFocusMinutes = useMemo(
    () => sessions.reduce((acc, s) => acc + s.duration, 0),
    [sessions],
  );

  const pomodoroByDay = useMemo(() => {
    const start = getWeekStart();
    const dayMap: Record<
      string,
      { label: string; minutes: number; sessions: number }
    > = {};

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dayMap[key] = { label: DAY_LABELS[i], minutes: 0, sessions: 0 };
    }

    // Add pomodoro data
    for (const s of sessions) {
      if (!s.createdAt) continue;
      const key = new Date(s.createdAt).toISOString().split("T")[0];
      if (dayMap[key]) {
        dayMap[key].minutes += s.duration;
        dayMap[key].sessions += 1;
      }
    }

    return dayMap;
  }, [sessions]);

  const dailyMinutes = Object.values(pomodoroByDay);
  const maxMinutes = Math.max(...dailyMinutes.map((d) => d.minutes), 1);

  if (sessions.length === 0) {
    return (
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
        <p className="text-xs text-slate-400 dark:text-dark-400 text-center py-3">
          Nenhuma sessão esta semana
        </p>
      </Card>
    );
  }

  return (
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

      <div className="flex flex-col gap-3">
        {/* Stats row */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold text-emerald-500">
              {sessions.length}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              sessões
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold text-violet-500">
              {totalFocusMinutes}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              minutos
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold text-amber-500">
              {sessions.length > 0
                ? Math.round(totalFocusMinutes / sessions.length)
                : 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              média/min
            </p>
          </div>
        </div>

        {/* Mini bar chart */}
        <div
          className="flex items-end justify-between gap-1 pt-1 pb-2"
          style={{ height: "72px" }}
        >
          {dailyMinutes.map((day) => {
            const heightPct =
              maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
            return (
              <div
                key={day.label}
                className="flex flex-col items-center gap-1 flex-1"
              >
                {/* Tooltip */}
                <span className="text-[9px] font-semibold text-slate-500 dark:text-dark-400 leading-none transition-opacity">
                  {day.minutes > 0 ? day.minutes : ""}
                </span>
                {/* Bar */}
                <div
                  className="w-full flex justify-center items-end"
                  style={{ height: "32px" }}
                >
                  <div
                    className="w-full max-w-[18px] rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(
                        (day.minutes / maxMinutes) * 32,
                        day.minutes > 0 ? 4 : 0,
                      )}px`,
                      backgroundColor:
                        day.minutes > 0
                          ? `rgba(16, 185, 129, ${
                              0.25 + (heightPct / 100) * 0.5
                            })`
                          : "transparent",
                    }}
                  />
                </div>
                {/* Day label */}
                <span
                  className={`text-[9px] font-semibold leading-none ${
                    day.minutes > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-dark-600"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Session list */}
        {sessions.slice(0, 2).map((session) => (
          <div key={session.id} className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="flex-1 truncate text-slate-700 dark:text-dark-200 font-medium">
              {session.taskName || "Sessão de foco"}
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
    </Card>
  );
};
